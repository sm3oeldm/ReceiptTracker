const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/authMiddleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get monthly report
router.get('/:year/:month', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);

  try {
    // Get user's group
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile.group_id) {
      return res.status(404).json({ error: 'User is not in a group' });
    }

    // Get group info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('id', profile.group_id)
      .single();

    if (groupError) throw groupError;

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get all receipts for the group in this month
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('*, categories(name, icon)')
      .eq('group_id', profile.group_id)
      .gte('receipt_date', startDate)
      .lte('receipt_date', endDate)
      .order('receipt_date', { ascending: false });

    if (receiptsError) throw receiptsError;

    // Fetch user display names for all unique user_ids in receipts
    const userIds = [...new Set(receipts.map(r => r.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    if (usersError) throw usersError;

    // Create a map of user_id to display_name
    const userDisplayNames = {};
    users.forEach(user => {
      userDisplayNames[user.id] = user.display_name;
    });

    // Calculate summary statistics
    const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.total, 0);
    const receiptCount = receipts.length;

    // Group by category
    const byCategory = {};
    receipts.forEach(receipt => {
      const categoryName = receipt.categories?.name || 'Other';
      const icon = receipt.categories?.icon || '📦';

      if (!byCategory[categoryName]) {
        byCategory[categoryName] = {
          category_name: categoryName,
          icon,
          total: 0,
          count: 0
        };
      }

      byCategory[categoryName].total += receipt.total;
      byCategory[categoryName].count += 1;
    });

    // Convert to array and calculate percentages
    const byCategoryArray = Object.values(byCategory).map(category => ({
      ...category,
      percentage: parseFloat(((category.total / totalSpent) * 100).toFixed(1))
    }));

    // Group by member
    const byMember = {};
    receipts.forEach(receipt => {
      const memberName = userDisplayNames[receipt.user_id] || 'Unknown';

      if (!byMember[memberName]) {
        byMember[memberName] = {
          display_name: memberName,
          total: 0,
          receipt_count: 0,
          by_category: {}
        };
      }

      byMember[memberName].total += receipt.total;
      byMember[memberName].receipt_count += 1;

      const categoryName = receipt.categories?.name || 'Other';
      if (!byMember[memberName].by_category[categoryName]) {
        byMember[memberName].by_category[categoryName] = 0;
      }
      byMember[memberName].by_category[categoryName] += receipt.total;
    });

    // Convert member categories to array
    const byMemberArray = Object.values(byMember).map(member => ({
      ...member,
      by_category: Object.entries(member.by_category).map(([name, total]) => ({
        category_name: name,
        total
      }))
    }));

    // Get trend data (last 6 months)
    const trend = [];
    for (let i = 0; i < 6; i++) {
      const trendMonth = month - i;
      const trendYear = year;
      let trendMonthYear = `${trendYear}-${trendMonth.toString().padStart(2, '0')}`;

      if (trendMonth < 1) {
        trendMonthYear = `${trendYear - 1}-${(12 + trendMonth).toString().padStart(2, '0')}`;
      }

      const trendStartDate = new Date(trendYear, trendMonth - 1, 1).toISOString().split('T')[0];
      const trendEndDate = new Date(trendYear, trendMonth, 0).toISOString().split('T')[0];

      const { data: trendReceipts, error: trendError } = await supabase
        .from('receipts')
        .select('total')
        .eq('group_id', profile.group_id)
        .gte('receipt_date', trendStartDate)
        .lte('receipt_date', trendEndDate);

      if (trendError) throw trendError;

      const trendTotal = trendReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
      trend.push({
        month: trendMonthYear,
        total: trendTotal
      });
    }

    // Reverse trend to be chronological
    trend.reverse();

    // Format receipts for response
    const formattedReceipts = receipts.map(receipt => ({
      id: receipt.id,
      merchant: receipt.merchant,
      total: receipt.total,
      date: receipt.receipt_date,
      category: receipt.categories?.name || 'Other',
      member: userDisplayNames[receipt.user_id] || 'Unknown'
    }));

    res.json({
      year,
      month,
      group: {
        id: group.id,
        name: group.name
      },
      summary: {
        total_spent: totalSpent,
        receipt_count: receiptCount
      },
      by_category: byCategoryArray,
      by_member: byMemberArray,
      trend,
      receipts: formattedReceipts
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export CSV
router.get('/:year/:month/export/csv', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);

  try {
    // Get user's group
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile.group_id) {
      return res.status(404).json({ error: 'User is not in a group' });
    }

    // Get group info
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', profile.group_id)
      .single();

    if (groupError) throw groupError;

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get all receipts for the group in this month
    const { data: receipts, error: receiptsError } = await supabase
      .from('receipts')
      .select('*, categories(name)')
      .eq('group_id', profile.group_id)
      .gte('receipt_date', startDate)
      .lte('receipt_date', endDate)
      .order('receipt_date', { ascending: true });

    if (receiptsError) throw receiptsError;

    // Fetch user display names for all unique user_ids in receipts
    const userIds = [...new Set(receipts.map(r => r.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    if (usersError) throw usersError;

    // Create a map of user_id to display_name
    const userDisplayNames = {};
    users.forEach(user => {
      userDisplayNames[user.id] = user.display_name;
    });

    // Generate CSV content
    const csvHeader = 'Date,Merchant,Category,Total,Currency,Member,Notes\n';
    const csvRows = receipts.map(receipt => {
      const date = receipt.receipt_date;
      const merchant = receipt.merchant.replace(/\+/g, ' ');
      const category = receipt.categories?.name || 'Other';
      const total = receipt.total;
      const currency = receipt.currency || 'AED';
      const member = userDisplayNames[receipt.user_id] || 'Unknown';
      const notes = receipt.notes ? receipt.notes.replace(/\+/g, ' ') : '';

      return `${date},"${merchant}","${category}",${total},${currency},"${member}","${notes}"`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Set headers for CSV download
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${group.name}_${year}-${month.toString().padStart(2, '0')}.csv"`);

    res.send(csvContent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;