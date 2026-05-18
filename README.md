# 🚀 QuickChat

**QuickChat**, gizlilik odaklı, uçtan uca şifreli (E2EE) ve tamamen terminal üzerinden çalışan modern bir mesajlaşma uygulamasıdır.

![QuickChat Banner](https://raw.githubusercontent.com/username/repo/main/assets/banner.png) *(Buraya terminalden aldığın o güzel ekran görüntüsünü veya bir GIF ekleyebilirsin)*

---

## ✨ Özellikler

- **🔐 Uçtan Uca Şifreleme:** Mesajlar `AES-256-GCM` algoritması ile istemci tarafında şifrelenir. Sunucu mesaj içeriğini asla göremez.
- **🕵️ Gizlilik Odaklı:** Mesajlar alıcı tarafından okunduğu anda sunucudan kalıcı olarak silinir ("Görüldü = Sil" mantığı).
- **📟 CLI Arayüzü:** Hiçbir web veya mobil arayüze ihtiyaç duymadan, sadece terminal üzerinden hızlı ve hafif mesajlaşma.
- **🛡️ Güvenli Oturum:** JWT tabanlı kimlik doğrulama ve güvenli şifre saklama (bcrypt).
- **👥 Grup Desteği:** Bire bir (DM) veya grup kanalları üzerinden iletişim.
- **🏗️ Senior Mimari:** Backend tarafında ölçeklenebilir `Service -> Controller -> Route` yapısı.

---

## 🛠 Teknoloji Yığını

- **Runtime:** Node.js (LTS)
- **Framework:** Express.js
- **Veritabanı:** SQLite (better-sqlite3)
- **Şifreleme:** Node.js built-in `crypto` modülü
- **Bağlantı:** HTTP/TLS (Let's Encrypt destekli)

---

## 🚀 Kurulum

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/kullaniciadi/quickchat.git
cd quickchat
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Yapılandırma
`.env` dosyasını oluşturun ve gerekli anahtarları ekleyin:
```env
PORT=3000
JWT_SECRET=senin_cok_gizli_jwt_anahtarin
APP_SECRET=mesajlari_sifrelemek_icin_anahtar
DB_PATH=./quickchat.db
SERVER_HOST=localhost
```

### 4. Global Komutu Aktif Edin
```bash
npm link
```

---

## 📖 Kullanım

### Sunucuyu Başlatma
```bash
npm start
```

### Admin İşlemleri
```bash
# Kullanıcı ekleme
node scripts/add-user.js <kullanici_adi> <sifre>

# Grup oluşturma
node scripts/add-group.js <grup_adi> <uye1> <uye2>
```

### Mesajlaşmaya Başlayın
Terminalin herhangi bir yerinden:
```bash
quickchat
```

---

## 🏗 Mimari Yapı

Proje, sürdürülebilirlik ve test edilebilirlik için modüler bir yapıda tasarlanmıştır:

- **Routes:** Endpoint tanımları ve yönlendirme.
- **Controllers:** Request/Response yönetimi ve validasyon.
- **Services:** Saf iş mantığı (Business Logic) ve veritabanı erişimi.
- **Client:** Bağımsız şifreleme katmanına sahip CLI istemcisi.

---

## 🔒 Güvenlik Notu
Bu uygulama eğitim ve gizlilik deneyi amaçlıdır. `APP_SECRET` anahtarınızı kimseyle paylaşmayın; bu anahtar olmadan mesajların şifresi asla çözülemez.

---
⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
