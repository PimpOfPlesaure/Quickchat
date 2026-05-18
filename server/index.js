const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const https = require('https');
const http = require('http');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const statusRoutes = require('./routes/status');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Çok fazla istek gönderildi, lütfen bekleyin.' }
});

app.use(limiter);
app.use(express.json());

// Rotaları doğrudan /api altına bağlayalım ki karmaşa olmasın
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/status', statusRoutes);

const options = {
  key: fs.existsSync(process.env.TLS_KEY_PATH) ? fs.readFileSync(process.env.TLS_KEY_PATH) : null,
  cert: fs.existsSync(process.env.TLS_CERT_PATH) ? fs.readFileSync(process.env.TLS_CERT_PATH) : null,
};

if (options.key && options.cert) {
  https.createServer(options, app).listen(PORT, () => {
    console.log(`QuickChat Server running on https://localhost:${PORT}`);
  });
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`QuickChat Server running on http://localhost:${PORT}`);
  });
}
