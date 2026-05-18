#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const readline = require('readline');
const http = require('http');
const crypto = require('node:crypto');

// Renk Kodları
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m'
};

const SERVER_HOST = process.env.SERVER_HOST || 'localhost';
const SERVER_PORT = process.env.PORT || 3000;
const APP_SECRET = process.env.APP_SECRET;

if (!APP_SECRET) {
  console.error(`${C.red}[!] HATA: .env dosyasında APP_SECRET tanımlanmamış!${C.reset}`);
  process.exit(1);
}

let token = null;
let currentUser = null;
let currentChat = null;
let lastMessageTimestamp = 0;
let pollingInterval = null;

function getDerivedKey() {
  return crypto.hkdfSync('sha256', APP_SECRET, '', 'quickchat-key', 32);
}

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getDerivedKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return `${iv.toString('base64')}:${encrypted}:${authTag}`;
}

function decrypt(cipherText) {
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return `${C.red}[Hatalı Format]${C.reset}`;
    
    const [ivBase64, encryptedBase64, authTagBase64] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getDerivedKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return `${C.red}[Şifre Çözme Hatası]${C.reset}`;
  }
}

function request(method, path, body = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode === 401 && token) {
          token = null;
          clearInterval(pollingInterval);
          showLoginScreen('Oturum sona erdi');
          return;
        }
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          if (res.statusCode >= 400) reject(parsed.error || `Hata: ${res.statusCode}`);
          else resolve(parsed);
        } catch (e) {
          reject(`Hata: ${res.statusCode}`);
        }
      });
    });

    req.on('error', () => reject('Bağlantı hatası'));
    if (data) req.write(data);
    req.end();
  });
}

function printBanner() {
  console.log(`${C.blue}${C.bright}
  ██████╗ ██╗   ██╗██╗ ██████╗██╗  ██╗ ██████╗██╗  ██╗ █████╗ ████████╗
  ██╔══██╗██║   ██║██║██╔════╝██║ ██╔╝██╔════╝██║  ██║██╔══██╗╚══██╔══╝
  ██║  ██║██║   ██║██║██║     █████╔╝ ██║     ███████║███████║   ██║   
  ██║  ██║██║   ██║██║██║     ██╔═██╗ ██║     ██╔══██║██╔══██║   ██║   
  ██████╔╝╚██████╔╝██║╚██████╗██║  ██╗╚██████╗██║  ██║██║  ██║   ██║   
  ╚═════╝  ╚═════╝ ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
  ${C.reset}`);
}

function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });
}

async function showLoginScreen(message = '') {
  console.clear();
  printBanner();
  if (message) console.log(`\n${C.red}[!] ${message}${C.reset}\n`);

  const rl = createRL();
  const username = await new Promise((resolve) => rl.question(`${C.bright}Kullanıcı adı: ${C.reset}`, resolve));
  rl.close();

  const password = await new Promise((resolve) => {
    process.stdout.write(`${C.bright}Şifre: ${C.reset}`);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    let pw = '';
    const onData = (char) => {
      if (char === '\r' || char === '\n' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(pw);
      } else if (char === '\u0003') process.exit();
      else if (char === '\u0008' || char === '\x7f') {
        if (pw.length > 0) {
          pw = pw.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        pw += char;
        process.stdout.write('*');
      }
    };
    process.stdin.on('data', onData);
  });

  try {
    const res = await request('POST', '/api/auth/login', { username, password });
    token = res.token;
    currentUser = { username };
    await showChatList();
  } catch (err) {
    await showLoginScreen('Giriş başarısız');
  }
}

async function showChatList() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  currentChat = null;
  console.clear();
  printBanner();
  console.log(`${C.cyan}${C.bright}# SOHBET LISTESI${C.reset}\n`);

  let items = [];
  try {
    const [users, groups] = await Promise.all([
      request('GET', '/api/users', null, token),
      request('GET', '/api/groups', null, token)
    ]);

    users
      .filter(u => u.username !== currentUser.username)
      .forEach(u => items.push({ type: 'dm', id: u.id, name: u.username }));
    groups.forEach(g => items.push({ type: 'group', id: g.id, name: g.name, members: g.members }));

    items.forEach((item, i) => {
      const label = item.type === 'group' ? `${C.yellow}${item.name} (Grup)${C.reset}` : `${C.green}${item.name}${C.reset}`;
      console.log(`  [${C.bright}${i + 1}${C.reset}] ${label}`);
    });
  } catch (err) {
    console.log(`${C.red}Liste yüklenemedi${C.reset}`);
  }

  console.log(`\n${C.gray}(q: Çıkış)${C.reset}`);

  const rl = createRL();
  const choice = await new Promise((resolve) => rl.question(`${C.bright}- Seçim: ${C.reset}`, resolve));
  rl.close();

  if (choice.toLowerCase() === 'q') process.exit();

  const selected = items[parseInt(choice) - 1];
  if (selected) await startChat(selected);
  else await showChatList();
}

async function startChat(chat) {
  currentChat = chat;
  lastMessageTimestamp = 0;
  console.clear();
  printBanner();

  const headerLabel = chat.type === 'group' ? 'GRUP' : 'KULLANICI';
  console.log(`${C.cyan}${C.bright}# ${headerLabel}: ${chat.name.toUpperCase()}${C.reset}`);
  console.log(`${C.dim}------------------------------------------------${C.reset}\n`);

  await fetchAndPrintMessages();
  setupPolling();

  while (currentChat) {
    const rl = createRL();
    rl.setPrompt(`${C.blue}${C.bright}~/ : ${C.reset}`);
    rl.prompt();

    const line = await new Promise((resolve) => rl.once('line', resolve));
    rl.close();

    if (line.trim().toLowerCase() === 'q') {
      clearInterval(pollingInterval);
      pollingInterval = null;
      currentChat = null;
      await showChatList();
      return;
    }

    if (line.trim()) {
      try {
        const encryptedContent = encrypt(line.trim());
        const path = currentChat.type === 'dm' ? '/api/messages/dm' : '/api/messages/group';
        const body = currentChat.type === 'dm'
          ? { receiver_id: currentChat.id, content: encryptedContent }
          : { group_id: currentChat.id, content: encryptedContent };

        await request('POST', path, body, token);

        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
        const dateStr = new Date().toLocaleString('tr-TR');
        console.log(`${C.green}${C.bright}*/ ${line.trim()} /*${C.reset} ${C.gray}[${dateStr}]${C.cyan}[${currentUser.username}]${C.reset}`);
      } catch (err) {
        console.log(`${C.red}Gönderilemedi${C.reset}`);
      }
    }
  }
}

function printMessage(msg) {
  const dateStr = new Date(msg.timestamp).toLocaleString('tr-TR');
  const content = decrypt(msg.content);
  const color = currentChat.type === 'dm' ? C.blue : C.yellow;
  console.log(`${color}${C.bright}*/ ${content} /*${C.reset} ${C.gray}[${dateStr}]${C.cyan}[${msg.sender_username}]${C.reset}`);
}

async function fetchAndPrintMessages() {
  const path = currentChat.type === 'dm'
    ? `/api/messages/dm/${currentChat.id}?since=${lastMessageTimestamp}`
    : `/api/messages/group/${currentChat.id}?since=${lastMessageTimestamp}`;

  try {
    const messages = await request('GET', path, null, token);
    if (messages.length > 0) {
      messages.forEach(msg => {
        printMessage(msg);
        if (msg.timestamp > lastMessageTimestamp) lastMessageTimestamp = msg.timestamp;
      });
      await request('POST', '/api/messages/seen', { message_ids: messages.map(m => m.id) }, token);
    }
  } catch (err) {}
}

function setupPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    if (!currentChat) return;
    try {
      const path = currentChat.type === 'dm'
        ? `/api/messages/dm/${currentChat.id}?since=${lastMessageTimestamp}`
        : `/api/messages/group/${currentChat.id}?since=${lastMessageTimestamp}`;

      const messages = await request('GET', path, null, token);
      if (messages.length > 0) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        messages.forEach(msg => {
          printMessage(msg);
          if (msg.timestamp > lastMessageTimestamp) lastMessageTimestamp = msg.timestamp;
        });
        await request('POST', '/api/messages/seen', { message_ids: messages.map(m => m.id) }, token);
        process.stdout.write(`${C.blue}${C.bright}~/ : ${C.reset}`);
      }
    } catch (err) {}
  }, 5000);
}

showLoginScreen();
