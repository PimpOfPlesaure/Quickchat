const db = require('../server/db');
require('dotenv').config();

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Kullanım: node scripts/add-group.js <group_name> <username1> <username2> ...');
  process.exit(1);
}

const [groupName, ...usernames] = args;

try {
  db.transaction(() => {
    // Grubu oluştur
    const groupStmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
    const groupResult = groupStmt.run(groupName);
    const groupId = groupResult.lastInsertRowid;

    // Kullanıcıları bul ve gruba ekle
    const userStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const memberStmt = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');

    for (const username of usernames) {
      const user = userStmt.get(username);
      if (user) {
        memberStmt.run(groupId, user.id);
        console.log(`Kullanıcı eklendi: ${username}`);
      } else {
        console.warn(`Uyarı: Kullanıcı bulunamadı, atlanıyor: ${username}`);
      }
    }

    console.log(`Grup başarıyla oluşturuldu: ${groupName} (ID: ${groupId})`);
  })();
} catch (err) {
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.error('Hata: Bu grup adı zaten alınmış.');
  } else {
    console.error('Hata oluştu:', err.message);
  }
} finally {
  db.close();
}
