// api/index.js
// Expose the Express app as a Vercel Serverless Function
const app = require('../src/back/server');
module.exports = app;