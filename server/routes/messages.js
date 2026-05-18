const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/dm/:userId', auth, messageController.getDMMessages);
router.get('/group/:groupId', auth, messageController.getGroupMessages);
router.post('/dm', auth, messageController.sendDM);
router.post('/group', auth, messageController.sendGroupMessage);
router.post('/seen', auth, messageController.deleteMessages);

module.exports = router;
