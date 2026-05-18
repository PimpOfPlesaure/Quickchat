const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const statusController = require('../controllers/statusController');

// GET /api/status/:userId
router.get('/:userId', auth, statusController.getUserStatus);

module.exports = router;
