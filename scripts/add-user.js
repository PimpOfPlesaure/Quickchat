const bcrypt = require('bcrypt');
const db = require('../server/db');
require('dotenv').config();

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Kullanım: node scripts/add-user.js <username> <password>');
  process.exit(1);
}

const [username, password] = args;

try {
  const saltRounds = 12;
  const hash = bcrypt.hashSync(password, saltRounds);

  const stmt = db.prepare('INSERT INTO users (username, pass_hash) VALUES (?, ?)');
  stmt.run(username, hash);

  console.log(`Kullanıcı başarıyla eklendi: ${username}`);
} catch (err) {
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.error('Hata: Bu kullanıcı adı zaten alınmış.');
  } else {
    console.error('Hata oluştu:', err.message);
  }
} finally {
  db.close();
}
