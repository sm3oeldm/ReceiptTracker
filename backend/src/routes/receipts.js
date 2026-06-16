const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/authMiddleware');
const { validateReceiptInput, validateWarrantyInput, validateQueryParams, validateUUIDParam } = require('../middleware/validationMiddleware');
const { RATE_LIMITS } = require('../config/constants');
const { withModelFallback } = require('../config/gemini');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Rate limiter for receipt parsing (costly Gemini API calls)
const parseLimiter = rateLimit({
  windowMs: RATE_LIMITS.RECEIPT_PARSE.windowMs,
  max: RATE_LIMITS.RECEIPT_PARSE.max,
  message: RATE_LIMITS.RECEIPT_PARSE.message,
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for in-memory storage with size and type limits
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, HEIC`));
    }
  }
});

// Parse receipt image using Gemini
router.post('/parse', authMiddleware, parseLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Prepare the prompt — ask Gemini to also extract warranty/return info if visible
    const prompt = `You are a receipt parser. Extract the following from the receipt image and return ONLY valid JSON with no markdown, no explanation:
    { "merchant": string, "total": number, "currency": string, "date": "YYYY-MM-DD", "items": [{ "name": string, "price": number }], "warranty_duration": string|null, "return_period": string|null, "warranty_notes": string|null }.
    If a field cannot be determined, use null. The currency should be the ISO 4217 code (e.g. AED, USD).
    For warranty_duration: look for warranty periods like "2 years", "1 year", "90 days" etc. on the receipt.
    For return_period: look for return policy text like "30 days", "14 days", etc.
    For warranty_notes: any additional warranty or return policy details visible on the receipt.`;

    // Send the image to Gemini with automatic model fallback on quota errors
    const result = await withModelFallback((genAI, modelName) => {
      const model = genAI.getGenerativeModel({ model: modelName });
      return model.generateContent([
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt },
      ]);
    });

    const responseText = result.response.text();
    console.log('Gemini raw response:', responseText.substring(0, 500));

    // Try to parse the JSON response (handle markdown-wrapped JSON)
    let parsedData;
    try {
      // Strip markdown code blocks if present
      let cleaned = responseText.trim();
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleaned = jsonMatch[1].trim();
      }
      parsedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError.message);
      return res.status(422).json({
        error: 'Failed to parse receipt data',
        details: 'The AI response could not be parsed as JSON'
      });
    }

    // Validate only total is required — user can fill in the rest
    if (!parsedData.total && parsedData.total !== 0) {
      return res.status(422).json({
        error: 'Incomplete receipt data',
        details: 'Could not determine the total amount',
        parsedData
      });
    }

    res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('Gemini API error:', error.message);
    if (error.code === 'ALL_MODELS_EXHAUSTED') {
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'The server is overloaded. Please try again later.'
      });
    }
    res.status(500).json({
      error: 'Failed to process receipt image',
      details: error.message
    });
  }
});

// Save a receipt
router.post('/', authMiddleware, validateReceiptInput, validateWarrantyInput, async (req, res) => {
  const { merchant, total, currency, date, items, category_id, notes, warranty_duration, warranty_expiry_date, return_period, return_expiry_date, warranty_notes, extracted_by_gemini } = req.body;
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
        notes,
        warranty_duration: warranty_duration || null,
        warranty_expiry_date: warranty_expiry_date || null,
        return_period: return_period || null,
        return_expiry_date: return_expiry_date || null,
        warranty_notes: warranty_notes || null,
        extracted_by_gemini: extracted_by_gemini || false
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
router.get('/', authMiddleware, validateQueryParams, async (req, res) => {
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
router.get('/:id', authMiddleware, validateUUIDParam, async (req, res) => {
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
router.put('/:id', authMiddleware, validateUUIDParam, validateReceiptInput, validateWarrantyInput, async (req, res) => {
  const receiptId = req.params.id;
  const userId = req.user.id;
  const { merchant, total, currency, date, items, category_id, notes, warranty_duration, warranty_expiry_date, return_period, return_expiry_date, warranty_notes } = req.body;

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
        notes,
        warranty_duration: warranty_duration !== undefined ? warranty_duration : undefined,
        warranty_expiry_date: warranty_expiry_date !== undefined ? warranty_expiry_date : undefined,
        return_period: return_period !== undefined ? return_period : undefined,
        return_expiry_date: return_expiry_date !== undefined ? return_expiry_date : undefined,
        warranty_notes: warranty_notes !== undefined ? warranty_notes : undefined
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
router.delete('/:id', authMiddleware, validateUUIDParam, async (req, res) => {
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

// GET /warranties — get receipts with active warranties or return periods
router.get('/warranties/list', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's group
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile.group_id) {
      return res.json([]);
    }

    // Fetch receipts with non-null warranty or return fields
    const { data, error } = await supabase
      .from('receipts')
      .select('*, categories(name, icon)')
      .eq('group_id', profile.group_id)
      .or('warranty_expiry_date.not.is.null,return_expiry_date.not.is.null')
      .order('receipt_date', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Warranties fetch error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;