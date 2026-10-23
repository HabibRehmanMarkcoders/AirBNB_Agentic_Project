# Agentic AirBNB Backend

Simple Express API with cookie JWT auth.

## Structure

```
src/
├── middleware/     # Auth, Zod validate, errors
├── routes/         # URL paths
├── controllers/    # Request handlers + chat logic
├── models/         # Mongoose schemas
├── db/             # db.js Mongo connect
└── app.js          # Entry point
```

## Run

```bash
cd backend
npm install
npm run dev
```

Needs `.env` with `PORT`, `MONGO_URI`, `JWT_SECRET`, `API_KEY`, `AI_MODEL`, `CORS_ORIGIN`.

## MCP (listing tools)

Chat uses a custom MCP server (`scripts/listings-mcp-server.js`):

1. Backend MCP client discovers tools (`listTools`)
2. Tool definitions are passed to Gemini
3. Gemini chooses which tool to call
4. Backend executes via MCP `callTool` → MongoDB / cost math

Smoke test: `npm run test:mcp`
