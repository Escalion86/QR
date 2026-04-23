## QR Generator API (Express)

API for generating PNG QR codes for internal services.

### Features

- QR generation via HTTP API (`POST /api/v1/qr/generate`)
- Supported payload types:
  - `text`
  - `url`
  - `email`
  - `phone`
  - `sms`
  - `wifi`
  - `vcard`
  - `geo`
  - `event`
  - `whatsapp`
- PNG output only
- Configurable resolution (`resolutionPreset` or `width`)
- Configurable margin, error correction, dark/light colors
- Optional center logo from URL or Base64 data URL
- Swagger docs at `/docs`

### Run

```bash
npm install
npm start
```

Service URLs:

- Health: `GET /health`
- Types: `GET /api/v1/qr/types`
- Generate: `POST /api/v1/qr/generate`
- Docs: `GET /docs`

### Example request

```bash
curl -X POST http://localhost:3000/api/v1/qr/generate \
  -H "Content-Type: application/json" \
  --output qr.png \
  -d '{
    "type": "url",
    "data": {
      "url": "https://example.com"
    },
    "options": {
      "resolutionPreset": "high",
      "margin": 2,
      "errorCorrectionLevel": "M",
      "colorDark": "#111111",
      "colorLight": "#ffffff"
    }
  }'
```
# QR
