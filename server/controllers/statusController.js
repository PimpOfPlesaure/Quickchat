const statusService = require('../services/statusService');

class StatusController {
  getUserStatus(req, res) {
    try {
      const status = statusService.getUserStatus(req.params.userId);
      res.json(status);
    } catch (err) {
      if (err.message === 'USER_NOT_FOUND') {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
}

module.exports = new StatusController();
