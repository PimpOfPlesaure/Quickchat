const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/groups
router.get('/', auth, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT g.id, g.name, u.username
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN group_members gm2 ON g.id = gm2.group_id
      JOIN users u ON gm2.user_id = u.id
      WHERE gm.user_id = ?
    `).all(req.user.id);

    const groupsMap = new Map();
    for (const row of rows) {
      if (!groupsMap.has(row.id)) {
        groupsMap.set(row.id, { id: row.id, name: row.name, members: [] });
      }
      groupsMap.get(row.id).members.push(row.username);
    }
    res.json(Array.from(groupsMap.values()));
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
