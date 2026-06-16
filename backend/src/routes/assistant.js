const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/authMiddleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Format receipt context into a structured string for the system prompt.
 */
function formatReceiptContext(receipts, monthlySummary, memberSummary) {
  const today = new Date().toISOString().split('T')[0];
  const currency = receipts[0]?.currency || 'AED';

  // Monthly summary block
  const monthlyBlock = monthlySummary.map(m => {
    const month = new Date(m.month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
    return `  - ${month}: ${currency} ${parseFloat(m.total_spent).toFixed(2)} (${m.receipt_count} receipts)`;
  }).join('\n');

  // Current month members block
  const memberBlock = memberSummary.map(m =>
    `  - ${m.member_name}: ${currency} ${parseFloat(m.total_spent).toFixed(2)} (${m.receipt_count} receipts)`
  ).join('\n');

  // All receipts block — include items array so AI can answer line-item questions
  const receiptsBlock = receipts.map(r => {
    const items = Array.isArray(r.items) && r.items.length > 0
      ? r.items.map(i => `      • ${i.name}: ${currency} ${parseFloat(i.price).toFixed(2)}`).join('\n')
      : '      • (no line items)';
    return `  [${r.receipt_date}] ${r.merchant || 'Unknown'} | ${r.category_name || 'Uncategorized'} | ${currency} ${parseFloat(r.total).toFixed(2)} | by: ${r.member_name}\n    Items:\n${items}`;
  }).join('\n');

  return `TODAY'S DATE: ${today}

MONTHLY SPENDING SUMMARY (last 12 months):
${monthlyBlock || '  No data available.'}

CURRENT MONTH — SPENDING BY MEMBER:
${memberBlock || '  No data available.'}

ALL RECEIPTS (last 12 months, newest first):
${receiptsBlock || '  No receipts found.'}`;
}

/**
 * POST /api/assistant/chat
 * Chat with the AI spending assistant.
 */
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, conversation_history } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message field is required', code: 'MISSING_MESSAGE' });
    }

    // Fetch user's group
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
      return res.status(500).json({ error: 'Database error', code: 'DB_ERROR' });
    }

    const groupId = profile.group_id;
    if (!groupId) {
      return res.status(400).json({ error: 'User is not in a group. Join or create a group first.', code: 'NO_GROUP' });
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    // Query 1 — All receipts (last 12 months) with category and profile joins
    const { data: rawReceipts, error: receiptsError } = await supabase
      .from('receipts')
      .select(`
        id,
        merchant,
        total,
        currency,
        receipt_date,
        items,
        notes,
        categories ( name ),
        profiles ( display_name )
      `)
      .eq('group_id', groupId)
      .gte('receipt_date', twelveMonthsAgo.toISOString())
      .order('receipt_date', { ascending: false });

    if (receiptsError) {
      console.error('Receipts fetch error:', receiptsError.message);
      throw receiptsError;
    }

    // Flatten joined fields from Supabase nested result
    let receipts = (rawReceipts || []).map(r => ({
      ...r,
      category_name: r.categories?.name || null,
      member_name: r.profiles?.display_name || null
    }));

    // Token safety guard — keep only most recent 200 receipts
    if (receipts.length > 200) {
      receipts = receipts.slice(0, 200);
    }

    // Query 2 — Monthly summary (last 12 months)
    // Compute from receipts data since Supabase JS may not support DATE_TRUNC
    const monthlyMap = {};
    receipts.forEach(r => {
      if (!r.receipt_date) return;
      const monthKey = r.receipt_date.substring(0, 7);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey + '-01', total_spent: 0, receipt_count: 0 };
      }
      monthlyMap[monthKey].total_spent += parseFloat(r.total) || 0;
      monthlyMap[monthKey].receipt_count += 1;
    });
    const monthlyData = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));

    // Query 3 — Per-member summary (current month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: currentMonthReceipts, error: currentMonthError } = await supabase
      .from('receipts')
      .select(`
        total,
        profiles ( display_name )
      `)
      .eq('group_id', groupId)
      .gte('receipt_date', currentMonthStart);

    let memberData = [];
    if (!currentMonthError && currentMonthReceipts) {
      const memberMap = {};
      currentMonthReceipts.forEach(r => {
        const name = r.profiles?.display_name || 'Unknown';
        if (!memberMap[name]) {
          memberMap[name] = { member_name: name, total_spent: 0, receipt_count: 0 };
        }
        memberMap[name].total_spent += parseFloat(r.total) || 0;
        memberMap[name].receipt_count += 1;
      });
      memberData = Object.values(memberMap);
    }

    // Format context
    const contextString = formatReceiptContext(receipts, monthlyData, memberData);

    // Build system prompt
    const systemPrompt = `You are a helpful personal finance assistant built into a family receipt tracking app. You have access to the user's complete spending history for the last 12 months, including every receipt, every line item purchased, the store name, the date, the category, and which family member made the purchase.

Your job is to:
1. Answer any question about the user's spending data accurately and helpfully.
2. Provide general personal finance advice when asked.
3. Proactively give useful insights when relevant (e.g. if someone asks about groceries, mention if spending has increased compared to last month).

RULES:
- Always use the receipt data provided to give specific, accurate answers. Never make up numbers.
- When answering data questions, cite specific receipts or dates where helpful (e.g. "You bought milk at Carrefour on March 3rd for AED 4.50").
- For line-item questions (e.g. "cheapest milk"), search through the Items lists in the receipt data carefully.
- If the data doesn't contain enough information to answer a question, say so clearly and explain what data would be needed.
- Keep answers concise but complete. Use bullet points or short lists when listing multiple items.
- For financial advice questions, be practical and specific to the user's actual spending patterns when possible.
- Always be friendly, clear, and encouraging — not judgmental about spending habits.
- The default currency is shown in the data. Always include the currency code in monetary amounts.
- When comparing months, always mention both the absolute numbers and the percentage change.

HERE IS THE USER'S SPENDING DATA:
${contextString}`;

    // Build messages array — convert to Gemini format ({ role, parts: [{ text }] })
    const history = (Array.isArray(conversation_history) ? conversation_history : []).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Call Gemini API
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error('Assistant error:', error.message);
    if (error.status === 401 || error.status === 403) {
      return res.status(500).json({ error: 'AI service configuration error', code: 'AI_AUTH_ERROR' });
    }
    res.status(500).json({ error: 'Failed to process request', code: 'AI_ERROR' });
  }
});

module.exports = router;
