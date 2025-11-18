import express from 'express';
import { db } from './db';

const app = express();
app.use(express.json());

// ==========================
// Example route templates
// ==========================

// Accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await db.select().from('accounts');
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const data = req.body;
    const result = await db.insert('accounts').values(data).returning();
    res.json(result);
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// Goals
app.get('/api/goals', async (req, res) => {
  try {
    const goals = await db.select().from('goals');
    res.json(goals);
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Budgets
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await db.select().from('budgets');
    res.json(budgets);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Investments
app.get('/api/investments', async (req, res) => {
  try {
    const investments = await db.select().from('investments');
    res.json(investments);
  } catch (err) {
    console.error('Error fetching investments:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Installments
app.get('/api/installments', async (req, res) => {
  try {
    const installments = await db.select().from('installments');
    res.json(installments);
  } catch (err) {
    console.error('Error fetching installments:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ==========================
// Health check / test route
// ==========================
app.get('/api/test', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS now');
    res.json({ status: 'ok', time: result });
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ==========================
// Start server
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
