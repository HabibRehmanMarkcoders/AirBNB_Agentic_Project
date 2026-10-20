# Agentic AirBNB Backend

Express API with JWT authentication.

## Folder structure

```
backend/
├── public/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── utils/
│   ├── constants/
│   └── index.js
├── tests/
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Configure `.env`:

```env
PORT=5000
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>
```

3. Start the server:

```bash
npm run dev
```

## Auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | No | Create account in MongoDB + JWT |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Bearer token | Current user |
| GET | `/api/health` | No | Health check |

### Signup body

```json
{
  "username": "alex",
  "email": "alex@example.com",
  "password": "secret123"
}
```

### Login body

```json
{
  "email": "alex@example.com",
  "password": "secret123"
}
```

### Protected request header

```
Authorization: Bearer <token>
```

User schema: `backend/src/models/userModel.js` (`username`, `email`, `password`).
