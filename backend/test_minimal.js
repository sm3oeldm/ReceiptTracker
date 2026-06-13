const express = require('express');
const app = express();
app.use(express.json());

app.post('/test', (req, res) => {
  console.log('✅ Test endpoint hit!');
  console.log('Body:', req.body);
  res.json({ success: true, data: req.body });
});

app.listen(3002, () => {
  console.log('Minimal test server on port 3002');
});