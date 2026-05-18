const authService = require('../services/authService');

class AuthController {
  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir' });
    }

    try {
      const result = await authService.login(username, password);
      res.json(result);
    } catch (err) {
      if (err.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
      }
      res.status(500).json({ error: 'Sunucu hatası' });
    }
  }
}

module.exports = new AuthController();
