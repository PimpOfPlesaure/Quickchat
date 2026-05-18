const db = require('../db');

class StatusService {
  getUserStatus(userId) {
    const user = db.prepare('SELECT id, username, last_seen FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return { userId: user.id, last_seen: user.last_seen };
  }
}

module.exports = new StatusService();
