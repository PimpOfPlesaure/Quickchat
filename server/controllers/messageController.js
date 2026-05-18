const messageService = require('../services/messageService');

class MessageController {
  getDMMessages(req, res) {
    const targetUserId = req.params.userId;
    const since = req.query.since || 0;

    try {
      const messages = messageService.getDMMessages(req.user.id, targetUserId, since);
      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  getGroupMessages(req, res) {
    const groupId = req.params.groupId;
    const since = req.query.since || 0;

    try {
      const messages = messageService.getGroupMessages(req.user.id, groupId, since);
      res.json(messages);
    } catch (err) {
      if (err.message === 'NOT_A_MEMBER') {
        return res.status(403).json({ error: 'Bu grubun üyesi değilsiniz' });
      }
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  sendDM(req, res) {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content) {
      return res.status(400).json({ error: 'Eksik bilgi' });
    }

    try {
      const result = messageService.sendDM(req.user.id, receiver_id, content);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  sendGroupMessage(req, res) {
    const { group_id, content } = req.body;
    if (!group_id || !content) {
      return res.status(400).json({ error: 'Eksik bilgi' });
    }

    try {
      const result = messageService.sendGroupMessage(req.user.id, group_id, content);
      res.json(result);
    } catch (err) {
      if (err.message === 'NOT_A_MEMBER') {
        return res.status(403).json({ error: 'Bu grubun üyesi değilsiniz' });
      }
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }

  deleteMessages(req, res) {
    const { message_ids } = req.body;
    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return res.status(400).json({ error: 'message_ids dizisi gereklidir' });
    }

    try {
      const result = messageService.deleteMessages(req.user.id, message_ids);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
}

module.exports = new MessageController();
