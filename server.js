const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it with initial data
    const initialData = {
      inventory: [
        { category: "العمر 20-29", total: 20, remaining: 20 },
        { category: "العمر 30-40", total: 30, remaining: 30 },
        { category: "الدخل 401-500 (C2)", total: 60, remaining: 60 },
        { category: "الدخل 501-600 (C1)", total: 41, remaining: 41 },
        { category: "الدخل 601+ (A&B)", total: 48, remaining: 48 },
        { category: "نيدو", total: 90, remaining: 90 },
        { category: "حليبنا", total: 29, remaining: 29 },
        { category: "إنجوي", total: 29, remaining: 29 }
      ],
      transactions: [],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Read data from file
async function readData() {
  try {
    await initializeDataFile();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { inventory: [], transactions: [], lastUpdated: new Date().toISOString() };
  }
}

// Write data to file
async function writeData(data) {
  try {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

// Validate inventory to ensure remaining <= total
function validateInventory(inventory) {
  return inventory.map(item => {
    if (item.remaining > item.total) {
      item.remaining = item.total;
    }
    if (item.remaining < 0) {
      item.remaining = 0;
    }
    return item;
  });
}

// Recalculate remaining quantities based on transactions
function recalculateRemainingQuantities(inventory, transactions) {
  // Reset all remaining quantities to their total values
  const inventoryWithReset = inventory.map(item => ({
    ...item,
    remaining: item.total
  }));
  
  // Subtract quantities based on transactions
  transactions.forEach(transaction => {
    const item = inventoryWithReset.find(i => i.category === transaction.category);
    if (item) {
      item.remaining = Math.max(0, item.remaining - 1);
    }
  });
  
  return inventoryWithReset;
}

// Initialize data file on startup
initializeDataFile();

// API Routes

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    // Recalculate remaining quantities to ensure accuracy
    data.inventory = recalculateRemainingQuantities(data.inventory, data.transactions);
    data.inventory = validateInventory(data.inventory);
    await writeData(data); // Save the recalculated data
    res.json(data);
  } catch (error) {
    console.error('Error getting data:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

// Add a transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { categories, notes } = req.body;
    const timestamp = new Date().toISOString();
    
    // Validate input
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Categories are required' });
    }
    
    // Read current data
    let data = await readData();
    
    // Add transactions for each category
    categories.forEach(category => {
      const transaction = {
        category,
        notes: notes || '',
        timestamp
      };
      data.transactions.push(transaction);
    });
    
    // Recalculate remaining quantities
    data.inventory = recalculateRemainingQuantities(data.inventory, data.transactions);
    data.inventory = validateInventory(data.inventory);
    
    // Save updated data
    const success = await writeData(data);
    if (success) {
      res.json({ message: 'Transaction recorded successfully', data });
    } else {
      res.status(500).json({ error: 'Failed to save transaction' });
    }
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// Delete a transaction group
app.delete('/api/transactions/:timestamp', async (req, res) => {
  try {
    const { timestamp } = req.params;
    
    // Read current data
    let data = await readData();
    
    // Find and remove transactions with this timestamp
    const transactionsToRemove = data.transactions.filter(t => t.timestamp === timestamp);
    data.transactions = data.transactions.filter(t => t.timestamp !== timestamp);
    
    // Recalculate remaining quantities
    data.inventory = recalculateRemainingQuantities(data.inventory, data.transactions);
    data.inventory = validateInventory(data.inventory);
    
    // Save updated data
    const success = await writeData(data);
    if (success) {
      res.json({ message: 'Transaction deleted successfully', removedTransactions: transactionsToRemove.length });
    } else {
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});