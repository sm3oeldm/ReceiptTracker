const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/authMiddleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Get all categories (default + user's custom ones)
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create a custom category
router.post('/', authMiddleware, async (req, res) => {
  const { name, icon } = req.body;
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([{
        user_id: userId,
        name,
        icon,
        is_default: false
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a custom category
router.delete('/:id', authMiddleware, async (req, res) => {
  const categoryId = req.params.id;
  const userId = req.user.id;

  try {
    // First check if this is a default category
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('is_default, user_id')
      .eq('id', categoryId)
      .single();

    if (fetchError) throw fetchError;

    if (category.is_default) {
      return res.status(400).json({ error: 'Cannot delete default categories' });
    }

    if (category.user_id !== userId) {
      return res.status(403).json({ error: 'Cannot delete categories created by other users' });
    }

    // Delete the category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) throw deleteError;

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;