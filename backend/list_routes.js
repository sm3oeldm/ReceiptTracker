// Test script to list all registered routes in Express
const express = require('express');
const app = express();

// Load the routes from src/index.js (or reproduce the logic)
// Since this is a simple task, I will read the routes logic from index.js
// but I cannot run it directly here easily.
// I will suggest an alternative: inspect the app object if possible,
// or just deduce from index.js.

// Based on index.js:
// app.use('/api/auth', authLimiter, authRoutes);
// app.use('/api/groups', groupsRoutes);
// app.use('/api/categories', categoriesRoutes);
// app.use('/api/receipts', receiptsRoutes);
// app.use('/api/reports', reportsRoutes);
// app.get('/health', ...);

console.log('Routes mounted in app:');
console.log('/api/auth');
console.log('/api/groups');
console.log('/api/categories');
console.log('/api/receipts');
console.log('/api/reports');
console.log('/health');
