const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configure multer for in-memory storage (we don't save the image)
const upload = multer({ storage: multer.memoryStorage() });

// Parse receipt image using Gemini
router.post('/parse', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare the prompt
    const prompt = `You are a receipt parser. Extract the following from the receipt image and return ONLY valid JSON with no markdown, no explanation:
    { "merchant": string, "total": number, "currency": string, "date": "YYYY-MM-DD", "items": [{ "name": string, "price": number }] }.
    If a field cannot be determined, use null. The currency should be the ISO 4217 code (e.g. AED, USD).`;

    // Send the image to Gemini
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      },
      {
        text: prompt
      }
    ]);

    const responseText = result.response.text();

    // Try to parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(422).json({
        error: 'Failed to parse receipt data',
        details: 'The AI response could not be parsed as JSON',
        rawResponse: responseText
      });
    }

    // Validate the parsed data
    if (!parsedData.merchant || !parsedData.total || !parsedData.date) {
      return res.status(422).json({
        error: 'Incomplete receipt data',
        details: 'Missing required fields in parsed data',
        parsedData
      });
    }

    res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: 'Failed to process receipt image',
      details: error.message
    });
  }
});

// Save a receipt
router.post('/', authMiddleware, async (req, res) => {
  const { merchant, total, currency, date, items, category_id, notes } = req.body;
  const userId = req.user.id;

  try {
    // Get user's group_id from their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Insert the receipt
    const { data, error } = await supabase
      .from('receipts')
      .insert([{
        user_id: userId,
        group_id: profile.group_id,
        category_id,
        merchant,
        total,
        currency: currency || 'AED',
        receipt_date: date,
        items,
        notes
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all receipts for the user
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { month, year, category_id } = req.query;

  try {
    let query = supabase
      .from('receipts')
      .select('*, categories(name, icon)')
      .eq('user_id', userId)
      .order('receipt_date', { ascending: false });

    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();
      query = query.gte('receipt_date', startDate.split('T')[0])
                   .lte('receipt_date', endDate.split('T')[0]);
    }

    // Filter by category if provided
    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a single receipt
router.get('/:id', authMiddleware, async (req, res) => {
  const receiptId = req.params.id;
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, categories(name, icon)')
      .eq('id', receiptId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a receipt
router.put('/:id', authMiddleware, async (req, res) => {
  const receiptId = req.params.id;
  const userId = req.user.id;
  const { merchant, total, currency, date, items, category_id, notes } = req.body;

  try {
    const { data, error } = await supabase
      .from('receipts')
      .update({
        merchant,
        total,
        currency: currency || 'AED',
        receipt_date: date,
        items,
        category_id,
        notes
      })
      .eq('id', receiptId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a receipt
router.delete('/:id', authMiddleware, async (req, res) => {
  const receiptId = req.params.id;
  const userId = req.user.id;

  try {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;