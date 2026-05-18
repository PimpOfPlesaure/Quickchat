# AGENTS.md — quickchat

Bu dosya projenin tek kaynak belgesidir. Kod yazarken, dosya oluştururken veya bir karar alırken önce burayı oku. Burada yazan her şey tartışmasız geçerlidir.

---

## Proje Özeti

**quickchat**, terminalde çalışan, uçtan uca şifreli, gizlilik odaklı bir mesajlaşma uygulamasıdır. Maksimum 10 kullanıcı için tasarlanmıştır. Kullanıcılar birbirleriyle bire bir (DM) veya grup kanallarında mesajlaşabilir. Arayüz tamamen CLI'dır.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Sunucu çalışma ortamı | Node.js (LTS) |
| HTTP framework | Express.js |
| Veritabanı | SQLite (`better-sqlite3` paketi) |
| Şifreleme | Node.js built-in `node:crypto` modülü |
| Mimarî Yapı | Service - Controller - Route |
| İstemci Konfigürasyonu | `dotenv` (.env dosyası) |

---

## Proje Dosya Yapısı

```
quickchat/
├── server/
│   ├── index.js              # Sunucu girişi ve route tanımları
│   ├── db.js                 # SQLite bağlantısı ve tablo şeması
│   ├── routes/               # Sadece endpoint tanımları
│   ├── controllers/          # Request/Response yönetimi
│   ├── services/             # İş mantığı ve DB işlemleri
│   └── middleware/
│       └── auth.js           # JWT doğrulama
├── client/
│   └── index.js              # CLI uygulaması (Shebang destekli)
├── scripts/
│   ├── add-user.js           # Kullanıcı ekleme
│   └── add-group.js          # Grup ve üye yönetimi
├── .env                      # Ortam değişkenleri (Git'e eklenmez)
└── AGENTS.md                 # Bu dosya
```

---

## Mimarî Akış (Önemli)

Kod geliştirirken şu hiyerarşiye uyulmalıdır:
1.  **Route:** Sadece URL'yi karşılar ve ilgili Controller metoduna yönlendirir.
2.  **Controller:** İsteği (req) alır, temel validasyonu yapar, Service'i çağırır ve yanıtı (res) döner.
3.  **Service:** Tüm iş mantığı buradadır. Veritabanına sadece buradan erişilir. Express nesnelerinden (req, res) bağımsızdır.

---

## API Endpoint'leri

Tüm endpoint'ler `/api` prefix'i altındadır.

### Auth
- `POST /api/auth/login` -> `{ token }`

### Kullanıcılar ve Gruplar
- `GET /api/users` -> Tüm kullanıcılar.
- `GET /api/groups` -> Kullanıcının üye olduğu gruplar ve üyeleri.

### Mesajlar
- `GET /api/messages/dm/:userId` -> DM mesajları (Sadece karşıdan gelenler).
- `GET /api/messages/group/:groupId` -> Grup mesajları (Sadece başkalarından gelenler).
- `POST /api/messages/dm` -> Mesaj gönder.
- `POST /api/messages/group` -> Grup mesajı gönder.
- `POST /api/messages/seen` -> Mesajları sil (Görüldü = Sil).

---

## Mesajlaşma ve Şifreleme Mantığı

-   **Polling:** İstemci her 5 saniyede bir yeni mesajları kontrol eder.
-   **Kendi Mesajların:** İstemci gönderdiği mesajı ekrana anında basar. Sunucudan kendi mesajlarını geri çekmez.
-   **Gizlilik:** Mesajlar alıcı tarafından çekildikten (`seen` isteği) sonra veritabanından kalıcı olarak silinir.
-   **Encryption:** `AES-256-GCM` kullanılır. `APP_SECRET` üzerinden türetilen anahtarlar kullanılır.

---

## Admin Komutları

```bash
# Kullanıcı ekle
node scripts/add-user.js <username> <password>

# Grup oluştur ve üye ekle
node scripts/add-group.js <group_name> <user1> <user2>
```

---

## .env Yapılandırması

Hem sunucu hem istemci tarafından kullanılır:
```
PORT=3000
JWT_SECRET=...
APP_SECRET=...
DB_PATH=./quickchat.db
SERVER_HOST=localhost
```

---

## Geliştirme Notları

-   Yeni bir özellik eklerken önce **Service**, sonra **Controller**, en son **Route** yazılır.
-   İstemci tarafında `createRL()` fonksiyonu ile her input öncesi yeni bir readline interface oluşturulmalıdır.
-   Sunucu `better-sqlite3` kullandığı için DB işlemleri senkrondur, ancak API katmanı asenkrondur.
