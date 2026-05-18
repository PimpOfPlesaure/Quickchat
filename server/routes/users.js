const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/users
router.get('/', auth, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, last_seen FROM users').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
