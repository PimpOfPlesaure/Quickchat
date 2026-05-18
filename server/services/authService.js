const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

class AuthService {
  async login(username, password) {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(password, user.pass_hash);
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // last_seen güncelle
    db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(Date.now(), user.id);

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token };
  }
}

module.exports = new AuthService();
