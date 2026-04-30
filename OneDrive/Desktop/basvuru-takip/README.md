## 11. hafta ödevi 

[diyagram](./11.h.png)


## BaşvuruTakip — MongoDB Backend

Bu proje, `index.html` arayüzünü **Node.js (Express) + MongoDB** backend ile çalıştırır. Tüm kullanıcılar ve başvurular MongoDB’de saklanır.

### Kurulum

1) MongoDB çalıştırın (lokal veya Atlas).

2) Ortam dosyası oluşturun:

- `.env.example` dosyasını kopyalayıp `.env` yapın
- `MONGODB_URI` ve `JWT_SECRET` değerlerini girin

3) Bağımlılıkları kurun ve başlatın:

```bash
npm install
npm run dev
```

4) Tarayıcıdan açın:

- `http://localhost:3000`

### API

- `POST /api/auth/register` (email, password, password2)
- `POST /api/auth/login` (email, password)
- `GET /api/auth/me` (Authorization: Bearer)
- `GET /api/applications` (admin: tümü, user: kendi kayıtları)
- `POST /api/applications`
- `DELETE /api/applications/:id` (admin)
- `DELETE /api/applications` (admin, tümünü temizle)
- `GET /api/admin/users` (admin)
- `DELETE /api/admin/users/:email` (admin)

