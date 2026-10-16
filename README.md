# AgriCart — MVC Starter (React + Express + MongoDB)

This version reorganizes the AgriCart starter into separate routes, controllers, models, services, middleware, and configuration.

## Requirements
- Node.js LTS (18+ recommended)
- npm
- VS Code
- MongoDB Atlas account OR local MongoDB

## Project structure
```text
AgriCart-MVC/
├── client/
│   ├── src/
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## Run on Windows

### 1. Configure MongoDB
Create a MongoDB Atlas cluster and database user, then copy the connection string.
Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
Do not commit `.env` or share your connection string.

Example:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/agricart
CLIENT_ORIGIN=http://localhost:5173
DEMO_OTP=123456
```

For local MongoDB, use a URI such as `mongodb://127.0.0.1:27017/agricart`.

### 2. Start the backend
Terminal 1:
```powershell
cd server
npm install
npm run dev
```
Expected startup message: `AgriCart API running at http://localhost:5000`
Health check: `http://localhost:5000/api/health`

### 3. Start the frontend
Terminal 2:
```powershell
cd client
npm install
npm run dev
```
Open `http://localhost:5173`.

Keep both terminals open.

## Demo login
Select Farmer or Customer, enter a demo phone number, click Send demo OTP, then use `123456`.
This is development-only demo authentication. It is not production authentication and does not issue secure tokens.

## Notes
- Products and orders are stored in MongoDB, not `db.json`.
- The frontend is a simplified React web client so it runs directly in a desktop browser.
- Real SMS OTP, secure token-based sessions, online payments, weather, live mandi prices, and multilingual support are not implemented in this starter.
- The current demo login returns a user profile only; API write routes are not protected with real authentication yet. Do not deploy this starter publicly without implementing authentication and authorization.
