# QR Project

Project split into two parts:

- `server/` - Express API for QR generation
- `client/` - simple browser client for testing API requests

## Structure

```text
QR/
  server/
    src/
    package.json
  client/
    index.html
    main.js
    styles.css
  doc/
    API.md
```

## Server Run

```bash
cd server
npm install
npm start
```

Server URLs:

- API: `http://localhost:3000/api/v1/qr/generate`
- Types: `http://localhost:3000/api/v1/qr/types`
- Health: `http://localhost:3000/health`
- Swagger: `http://localhost:3000/docs`

Client env:

- `PUBLIC_BASE_URL` - external base URL used by UI for API requests, for example `https://qr.escalion.ru`

## Client Run

Simplest way:

1. Start server (`cd server && npm start`)
2. Open `client/index.html` in browser
3. Fill parameters and click `Generate QR`

If you prefer local static server for client:

```bash
cd client
python -m http.server 8080
```

Then open `http://localhost:8080`.

## API Docs

Detailed API documentation is in [doc/API.md](doc/API.md).
