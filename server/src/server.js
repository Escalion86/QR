const express = require("express");
const QRCode = require("qrcode");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const { Jimp } = require("jimp");

const { buildQrPayload, SUPPORTED_TYPES } = require("./payload/buildQrPayload");
const { downloadLogoBuffer } = require("./services/logo");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "2mb" }));

const RESOLUTION_PRESETS = {
  low: 256,
  medium: 512,
  high: 1024,
  ultra: 2048,
};

function getQrWidth(options = {}) {
  if (options.width) {
    const width = Number(options.width);
    if (Number.isNaN(width) || width < 128 || width > 4096) {
      throw new Error('Field "options.width" must be a number from 128 to 4096.');
    }
    return Math.round(width);
  }

  if (options.resolutionPreset) {
    const preset = String(options.resolutionPreset).toLowerCase();
    if (!RESOLUTION_PRESETS[preset]) {
      throw new Error(
        `Field "options.resolutionPreset" must be one of: ${Object.keys(RESOLUTION_PRESETS).join(", ")}.`
      );
    }
    return RESOLUTION_PRESETS[preset];
  }

  return RESOLUTION_PRESETS.medium;
}

function getMargin(options = {}) {
  if (options.margin === undefined) return 2;
  const margin = Number(options.margin);
  if (Number.isNaN(margin) || margin < 0 || margin > 20) {
    throw new Error('Field "options.margin" must be a number from 0 to 20.');
  }
  return Math.round(margin);
}

async function mergeLogo(qrBuffer, logoOptions = {}) {
  const logoBuffer = await downloadLogoBuffer(logoOptions);
  if (!logoBuffer) return qrBuffer;

  const qrImage = await Jimp.read(qrBuffer);
  const logoImage = await Jimp.read(logoBuffer);

  const ratio = Number(logoOptions.sizeRatio || 0.2);
  const clampedRatio = Math.max(0.1, Math.min(0.35, ratio));
  const targetSize = Math.round(Math.min(qrImage.bitmap.width, qrImage.bitmap.height) * clampedRatio);
  const padding = Math.max(0, Number(logoOptions.padding || 8));

  logoImage.resize({ w: targetSize, h: targetSize });

  const x = Math.floor((qrImage.bitmap.width - targetSize) / 2);
  const y = Math.floor((qrImage.bitmap.height - targetSize) / 2);

  if (padding > 0) {
    const background = new Jimp({
      width: targetSize + padding * 2,
      height: targetSize + padding * 2,
      color: logoOptions.backgroundColor || "#FFFFFF",
    });

    qrImage.composite(background, x - padding, y - padding);
  }

  qrImage.composite(logoImage, x, y);
  return qrImage.getBuffer("image/png");
}

/**
 * @swagger
 * tags:
 *   - name: Health
 *     description: Service health endpoints
 *   - name: QR
 *     description: QR generation endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: API is alive
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "qr-api", timestamp: new Date().toISOString() });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    service: "qr-api",
    status: "ok",
    message: "API is running.",
    docs: "/docs",
    health: "/health",
    generate: "/api/v1/qr/generate",
  });
});

/**
 * @swagger
 * /api/v1/qr/types:
 *   get:
 *     tags: [QR]
 *     summary: List supported QR payload types
 *     responses:
 *       200:
 *         description: Supported payload types
 */
app.get("/api/v1/qr/types", (_req, res) => {
  res.json({ types: SUPPORTED_TYPES });
});

/**
 * @swagger
 * /api/v1/qr/generate:
 *   post:
 *     tags: [QR]
 *     summary: Generate QR as PNG
 *     description: Returns PNG image. Supports text/url/email/phone/sms/wifi/vcard/geo/event/whatsapp payloads.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, data]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [text, url, email, phone, sms, wifi, vcard, geo, event, whatsapp]
 *               data:
 *                 type: object
 *                 description: Type-specific payload data
 *               options:
 *                 type: object
 *                 properties:
 *                   resolutionPreset:
 *                     type: string
 *                     enum: [low, medium, high, ultra]
 *                   width:
 *                     type: integer
 *                     minimum: 128
 *                     maximum: 4096
 *                   margin:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 20
 *                   errorCorrectionLevel:
 *                     type: string
 *                     enum: [L, M, Q, H]
 *                   colorDark:
 *                     type: string
 *                     example: "#000000"
 *                   colorLight:
 *                     type: string
 *                     example: "#ffffff"
 *                   logo:
 *                     type: object
 *                     properties:
 *                       url:
 *                         type: string
 *                         format: uri
 *                       base64:
 *                         type: string
 *                         description: Data URL format, for example data:image/png;base64,...
 *                       sizeRatio:
 *                         type: number
 *                         minimum: 0.1
 *                         maximum: 0.35
 *                       padding:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 40
 *                       backgroundColor:
 *                         type: string
 *                         example: "#ffffff"
 *           examples:
 *             url:
 *               summary: URL QR
 *               value:
 *                 type: url
 *                 data:
 *                   url: https://example.com
 *                 options:
 *                   resolutionPreset: high
 *                   margin: 2
 *                   colorDark: "#111111"
 *                   colorLight: "#ffffff"
 *             wifi:
 *               summary: WiFi QR
 *               value:
 *                 type: wifi
 *                 data:
 *                   ssid: MyWiFi
 *                   password: supersecret
 *                   security: WPA
 *                   hidden: false
 *                 options:
 *                   width: 768
 *                   errorCorrectionLevel: H
 *     responses:
 *       200:
 *         description: PNG image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Validation error
 */
app.post("/api/v1/qr/generate", async (req, res, next) => {
  try {
    const type = String(req.body?.type || "").trim().toLowerCase();
    if (!type) throw new Error('Field "type" is required.');

    const data = req.body?.data || {};
    const options = req.body?.options || {};

    const payload = buildQrPayload(type, data);
    const width = getQrWidth(options);
    const margin = getMargin(options);

    const errorCorrectionLevel = options.errorCorrectionLevel || "M";
    if (!["L", "M", "Q", "H"].includes(errorCorrectionLevel)) {
      throw new Error('Field "options.errorCorrectionLevel" must be one of L, M, Q, H.');
    }

    const qrBuffer = await QRCode.toBuffer(payload, {
      type: "png",
      width,
      margin,
      errorCorrectionLevel,
      color: {
        dark: options.colorDark || "#000000",
        light: options.colorLight || "#FFFFFF",
      },
    });

    const outputBuffer = await mergeLogo(qrBuffer, options.logo);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(outputBuffer);
  } catch (error) {
    next(error);
  }
});

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "QR Generator API",
      version: "1.0.0",
      description: "Internal API for generating PNG QR codes with styling and logo support.",
    },
    servers: [{ url: `http://localhost:${PORT}` }],
  },
  apis: [__filename],
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((err, _req, res, _next) => {
  const statusCode = err.statusCode || 400;
  res.status(statusCode).json({
    error: err.message || "Unexpected error",
  });
});

app.listen(PORT, () => {
  console.log(`QR API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
});
