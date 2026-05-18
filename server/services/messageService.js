const db = require('../db');

class MessageService {
  getDMMessages(userId, targetUserId, since = 0) {
    const limit = since ? 1000 : 50;
    // Sadece başkasından gelen (sender_id = targetUserId) mesajları getir
    // Kendi gönderdiklerini sunucudan geri çekme (zaten ekranda var)
    const messages = db.prepare(`
      SELECT m.id, m.sender_id, u.username as sender_username, m.content, m.timestamp 
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.sender_id = ? AND m.receiver_id = ?
      AND m.timestamp > ?
      ORDER BY m.timestamp DESC
      LIMIT ?
    `).all(targetUserId, userId, since, limit);

    return messages.reverse();
  }

  getGroupMessages(userId, groupId, since = 0) {
    // Üyelik kontrolü
    const isMember = db.prepare('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId);
    if (!isMember) {
      throw new Error('NOT_A_MEMBER');
    }

    const limit = since ? 1000 : 50;
    // Grupta başkalarının attığı mesajları getir (sender_id != userId)
    const messages = db.prepare(`
      SELECT m.id, m.sender_id, u.username as sender_username, m.content, m.timestamp 
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = ? AND m.sender_id != ? AND m.timestamp > ?
      ORDER BY m.timestamp DESC
      LIMIT ?
    `).all(groupId, userId, since, limit);

    return messages.reverse();
  }

  sendDM(senderId, receiverId, content) {
    const timestamp = Date.now();
    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(senderId, receiverId, content, timestamp);

    return { id: result.lastInsertRowid, timestamp };
  }

  sendGroupMessage(senderId, groupId, content) {
    const isMember = db.prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?'
    ).get(groupId, senderId);

    if (!isMember) {
      throw new Error('NOT_A_MEMBER');
    }

    const timestamp = Date.now();
    const result = db.prepare(`
      INSERT INTO messages (sender_id, group_id, content, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(senderId, groupId, content, timestamp);

    return { id: result.lastInsertRowid, timestamp };
  }

  deleteMessages(userId, messageIds) {
    const placeholders = messageIds.map(() => '?').join(',');
    const result = db.prepare(`
      DELETE FROM messages 
      WHERE id IN (${placeholders}) 
      AND (receiver_id = ? OR group_id IN (SELECT group_id FROM group_members WHERE user_id = ?))
    `).run(...messageIds, userId, userId);

    return { deleted: result.changes };
  }
}

module.exports = new MessageService();
