require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const CLIQ_TOKEN = process.env.CLIQ_TOKEN || 'change-me';

// Health check
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', time: new Date().toISOString() });
});

// Cliq webhook endpoint (token-protected)
app.post('/cliq/command', (req, res) => {
  const token = req.get('X-Cliq-Token') || req.body.token;
  if (!token || token !== CLIQ_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const body = req.body || {};
  const args = (body.args || body.command_text || '').toString().trim();

  // simple behavior: /expense summary
  if (args === 'summary' || args === '') {
    const card = {
      text: "Expense Summary",
      attachments: [
        {
          contentType: "application/vnd.zoho.cliq.card",
          content: {
            title: "Today · ₹450",
            subtitle: "Remaining budget: ₹3,550",
            description: "3 transactions today",
            actions: [
              { type: "button", text: "Add Expense", value: "add_expense" },
              { type: "button", text: "View 7-day", value: "view_7day" }
            ]
          }
        }
      ]
    };
    return res.json(card);
  }

  return res.json({ text: `Unknown arg "${args}". Try "summary"` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening ${PORT}`));
