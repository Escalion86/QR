# QR Generator API Documentation

## Overview

Internal API for generating QR codes in `PNG` format.

Base URL (local): `http://localhost:3000`  
Swagger UI: `GET /docs`  
Health check: `GET /health`

## Quick Start

```bash
npm install
npm start
```

Optional port:

```bash
PORT=3101 npm start
```

## Endpoints

### 1. Health Check

`GET /health`

Response:

```json
{
  "status": "ok",
  "service": "qr-api",
  "timestamp": "2026-04-23T08:00:00.000Z"
}
```

### 2. Supported QR Types

`GET /api/v1/qr/types`

Response:

```json
{
  "types": [
    "text",
    "url",
    "email",
    "phone",
    "sms",
    "wifi",
    "vcard",
    "geo",
    "event",
    "whatsapp"
  ]
}
```

### 3. Generate QR (PNG)

`POST /api/v1/qr/generate`

Content-Type: `application/json`  
Response: binary `image/png`

## Request Schema

```json
{
  "type": "url",
  "data": {},
  "options": {}
}
```

### `type`

Supported values:

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

### `data` by type

- `text`: `{ "value": "Hello" }`
- `url`: `{ "url": "https://example.com" }`
- `email`: `{ "email": "user@example.com", "subject": "Hi", "body": "Text" }`
- `phone`: `{ "phone": "+79990000000" }`
- `sms`: `{ "phone": "+79990000000", "message": "Hello" }`
- `wifi`: `{ "ssid": "MyWiFi", "password": "secret", "security": "WPA", "hidden": false }`
- `vcard`: `{ "fullName": "John Smith", "organization": "My Co", "title": "CEO", "phone": "+79990000000", "email": "john@example.com", "url": "https://example.com", "address": "City, Street", "note": "Contact" }`
- `geo`: `{ "lat": 55.7558, "lng": 37.6176 }`
- `event`: `{ "title": "Meeting", "start": "2026-05-01T10:00:00Z", "end": "2026-05-01T11:00:00Z", "location": "Office", "description": "Weekly sync" }`
- `whatsapp`: `{ "phone": "79990000000", "text": "Hello" }`

### `options`

- `resolutionPreset`: `low | medium | high | ultra`
- `width`: number `128..4096` (overrides preset)
- `margin`: number `0..20`
- `errorCorrectionLevel`: `L | M | Q | H`
- `colorDark`: hex color, e.g. `#000000`
- `colorLight`: hex color, e.g. `#ffffff`
- `logo`:
  - `url`: image URL
  - `base64`: data URL (`data:image/png;base64,...`)
  - `sizeRatio`: `0.1..0.35` (recommended `0.2`)
  - `padding`: `0..40`
  - `backgroundColor`: hex color

## Examples

### URL QR

```bash
curl -X POST http://localhost:3000/api/v1/qr/generate \
  -H "Content-Type: application/json" \
  --output qr-url.png \
  -d '{
    "type": "url",
    "data": { "url": "https://example.com" },
    "options": {
      "resolutionPreset": "high",
      "margin": 2,
      "colorDark": "#111111",
      "colorLight": "#ffffff"
    }
  }'
```

### WiFi QR

```bash
curl -X POST http://localhost:3000/api/v1/qr/generate \
  -H "Content-Type: application/json" \
  --output qr-wifi.png \
  -d '{
    "type": "wifi",
    "data": {
      "ssid": "OfficeWiFi",
      "password": "supersecret",
      "security": "WPA",
      "hidden": false
    },
    "options": {
      "width": 768,
      "errorCorrectionLevel": "H"
    }
  }'
```

### URL QR with logo

```bash
curl -X POST http://localhost:3000/api/v1/qr/generate \
  -H "Content-Type: application/json" \
  --output qr-logo.png \
  -d '{
    "type": "url",
    "data": { "url": "https://example.com" },
    "options": {
      "resolutionPreset": "high",
      "errorCorrectionLevel": "H",
      "logo": {
        "url": "https://example.com/logo.png",
        "sizeRatio": 0.2,
        "padding": 8,
        "backgroundColor": "#ffffff"
      }
    }
  }'
```

## Error Format

Errors return HTTP `400` and JSON:

```json
{
  "error": "Field \"type\" is required."
}
```

