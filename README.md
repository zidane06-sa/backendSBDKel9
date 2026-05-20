# Backend - Platform Publikasi Artikel Terkurasi

Backend service untuk platform publikasi artikel terkurasi dengan mekanisme review editorial.

## 📚 Project Description

Platform publikasi artikel terkurasi yang dirancang khusus untuk komunitas tech dan business. Saat ini, banyak platform publikasi artikel bersifat umum sehingga kualitas dan relevansi konten tidak selalu terjaga. 

### 🎯 Masalah yang Diselesaikan
- Mahasiswa di bidang teknologi seringkali hanya mengakses sumber teknis tanpa pemahaman konteks bisnis yang memadai
- Kualitas dan relevansi konten di platform umum tidak selalu terjaga
- Dibutuhkan platform yang mengintegrasikan wawasan teknologi dan bisnis

### ✨ Solusi
Sistem publikasi artikel dengan:
- **Mekanisme Review Editorial**: Setiap artikel melalui verifikasi admin sebelum dipublikasikan
- **Kontrol Kualitas**: Konten terjamin kualitas dan relevansinya
- **Dual Perspective**: Konten yang menggabungkan wawasan teknologi dan bisnis

### 👥 Target User
- Mahasiswa di bidang teknologi dan bisnis
- Praktisi teknologi dan bisnis
- Individu yang ingin memahami interkoneksi antara teknologi dan bisnis

### 🚀 Visi
Menghasilkan generasi inovator yang memahami bahwa solusi tidak hanya harus canggih, tetapi juga relevan, bernilai, dan berdampak nyata.

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v14+ 
- MongoDB
- npm atau yarn

### Environment Variables
Buat file `.env` di root directory:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=article_platform
JWT_SECRET=your_secret_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
NODE_ENV=development
```

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone git@github.com:apenchuu/miniproject_sbd_backend.git
   cd miniproject_sbd_backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start MongoDB**
   ```bash
   # Jika menggunakan MongoDB local
   mongod
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   Atau untuk production:
   ```bash
   npm start
   ```

Server akan berjalan di `http://localhost:4000`

### Verify Installation
Kunjungi `http://localhost:4000` untuk melihat routes yang tersedia:

```json
{
  "message": "Backend berjalan",
  "routes": {
    "auth": ["POST /api/auth/register", "POST /api/auth/login", "GET /api/auth/me", "GET /api/auth/admin"],
    "articles": ["GET /api/articles", "POST /api/articles (admin)", "PUT /api/articles/:id (admin)", "DELETE /api/articles/:id (admin)"]
  }
}
```

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│                  (React/Vue Client App)                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────────┐
│                   Express.js Server                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes                              │  │
│  │  ┌──────────────────┐    ┌──────────────────┐       │  │
│  │  │  Auth Routes     │    │ Article Routes   │       │  │
│  │  │  - Register      │    │ - Get Articles   │       │  │
│  │  │  - Login         │    │ - Create Article │       │  │
│  │  │  - Get Profile   │    │ - Update Article │       │  │
│  │  │  - Check Admin   │    │ - Delete Article │       │  │
│  │  └──────────────────┘    └──────────────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│                          │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Middleware Layer                         │  │
│  │  - Auth Middleware (JWT Verification)             │  │
│  │  - CORS Handler                                   │  │
│  │  - Error Handler                                  │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Services Layer                           │  │
│  │  ┌─────────────────┐    ┌─────────────────┐       │  │
│  │  │ Auth Service    │    │Article Service  │       │  │
│  │  │ - Hash Password │    │- Filter        │       │  │
│  │  │ - Generate JWT  │    │- Verify        │       │  │
│  │  │ - Verify Token  │    │- Transform     │       │  │
│  │  └─────────────────┘    └─────────────────┘       │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Data Models                              │  │
│  │  ┌──────────────────┐    ┌──────────────────┐     │  │
│  │  │  User Model      │    │  Article Model   │     │  │
│  │  │  - email         │    │  - title         │     │  │
│  │  │  - password      │    │  - content       │     │  │
│  │  │  - role          │    │  - status        │     │  │
│  │  │  - isAdmin       │    │  - author        │     │  │
│  │  └──────────────────┘    │  - createdAt     │     │  │
│  │                          │  - updatedAt     │     │  │
│  │                          └──────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ Mongoose ODM
┌────────────────────▼────────────────────────────────────────┐
│                  MongoDB Database                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Collections:                                        │  │
│  │  - users (Authentication & User Management)         │  │
│  │  - articles (Curated Articles)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**User Registration & Login:**
```
Client → Register/Login Request → Auth Controller → Auth Service 
→ Hash Password (bcryptjs) → Save to DB → Generate JWT → Return Token
```

**Article Submission & Review:**
```
Client → Submit Article → Article Controller → Check Admin Status 
→ Article Service → If Admin: Publish → Else: Pending Review → Save to DB
```

**Article Retrieval:**
```
Client → Get Articles → Auth Middleware (Verify JWT) → Article Controller 
→ Fetch from DB → Filter by Status → Return to Client
```

---

## 📁 Project Structure

```
miniproject_sbd_backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database connection config
│   ├── controllers/
│   │   ├── authController.js     # Auth logic (register, login)
│   │   └── articleController.js  # Article CRUD operations
│   ├── middlewares/
│   │   └── authMiddleware.js     # JWT verification middleware
│   ├── models/
│   │   ├── User.js               # User schema & model
│   │   └── Article.js            # Article schema & model
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   └── articleRoutes.js      # Article endpoints
│   └── services/
│       ├── authService.js        # Auth business logic
│       └── articleService.js     # Article business logic
├── server.js                     # Main application entry point
├── package.json                  # Dependencies & scripts
├── .env                          # Environment variables (not in repo)
└── README.md                     # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile (requires JWT)
- `GET /api/auth/admin` - Check admin status (requires JWT)

### Articles
- `GET /api/articles` - Get all published articles
- `POST /api/articles` - Submit article for review (admin can publish directly)
- `PUT /api/articles/:id` - Update article (requires admin role)
- `DELETE /api/articles/:id` - Delete article (requires admin role)

---

## 🔐 Authentication Flow

Platform menggunakan JWT (JSON Web Token) untuk authentication:

1. User register dengan email dan password
2. Password di-hash menggunakan bcryptjs
3. User login mendapat JWT token
4. Token digunakan di header request: `Authorization: Bearer <token>`
5. API middleware memverifikasi token sebelum mengakses protected routes

---

## 📝 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables management
- **pg** - PostgreSQL driver (optional)

---

## 🚀 Development Tips

- Use `npm run dev` untuk hot-reload development
- Check `.env` file configuration sebelum run
- Ensure MongoDB service is running
- Install Postman untuk testing API endpoints

---

## 📌 Notes

- Backend ini menggunakan MongoDB sebagai primary database
- Admin verification diperlukan untuk mempublikasikan artikel
- Setiap user mendapat JWT token setelah login
- CORS dikonfigurasi untuk mengizinkan akses dari frontend
