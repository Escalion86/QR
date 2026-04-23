const SUPPORTED_TYPES = [
  "text",
  "url",
  "email",
  "phone",
  "sms",
  "wifi",
  "vcard",
  "geo",
  "event",
  "whatsapp",
];

function ensureString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Field "${fieldName}" must be a non-empty string.`);
  }
  return value.trim();
}

function escapeWifi(value) {
  return String(value).replace(/([\\;,":])/g, "\\$1");
}

function buildWifi(data) {
  const ssid = ensureString(data?.ssid, "data.ssid");
  const security = (data?.security || "WPA").toUpperCase();
  const hidden = data?.hidden === true;
  const password = data?.password ? escapeWifi(data.password) : "";

  if (!["WPA", "WEP", "NOPASS"].includes(security)) {
    throw new Error('Field "data.security" must be one of WPA, WEP, NOPASS.');
  }

  return `WIFI:T:${security};S:${escapeWifi(ssid)};P:${password};H:${hidden ? "true" : "false"};;`;
}

function buildVcard(data) {
  const fullName = ensureString(data?.fullName, "data.fullName");
  const org = data?.organization || "";
  const title = data?.title || "";
  const phone = data?.phone || "";
  const email = data?.email || "";
  const url = data?.url || "";
  const address = data?.address || "";
  const note = data?.note || "";

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fullName}`,
    org ? `ORG:${org}` : "",
    title ? `TITLE:${title}` : "",
    phone ? `TEL:${phone}` : "",
    email ? `EMAIL:${email}` : "",
    url ? `URL:${url}` : "",
    address ? `ADR:;;${address};;;;` : "",
    note ? `NOTE:${note}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

function toIsoDate(value, fieldName) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Field "${fieldName}" must be a valid date string.`);
  }
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildEvent(data) {
  const title = ensureString(data?.title, "data.title");
  const start = toIsoDate(data?.start, "data.start");
  const end = toIsoDate(data?.end, "data.end");
  const location = data?.location || "";
  const description = data?.description || "";

  return [
    "BEGIN:VEVENT",
    `SUMMARY:${title}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    location ? `LOCATION:${location}` : "",
    description ? `DESCRIPTION:${description}` : "",
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildQrPayload(type, data) {
  if (!SUPPORTED_TYPES.includes(type)) {
    throw new Error(
      `Unsupported type "${type}". Supported types: ${SUPPORTED_TYPES.join(", ")}.`
    );
  }

  switch (type) {
    case "text":
      return ensureString(data?.value, "data.value");

    case "url":
      return ensureString(data?.url, "data.url");

    case "email": {
      const email = ensureString(data?.email, "data.email");
      const subject = data?.subject ? encodeURIComponent(data.subject) : "";
      const body = data?.body ? encodeURIComponent(data.body) : "";
      return `mailto:${email}?subject=${subject}&body=${body}`;
    }

    case "phone":
      return `tel:${ensureString(data?.phone, "data.phone")}`;

    case "sms": {
      const phone = ensureString(data?.phone, "data.phone");
      const message = data?.message ? encodeURIComponent(data.message) : "";
      return `SMSTO:${phone}:${message}`;
    }

    case "wifi":
      return buildWifi(data);

    case "vcard":
      return buildVcard(data);

    case "geo": {
      const lat = Number(data?.lat);
      const lng = Number(data?.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error('Fields "data.lat" and "data.lng" must be numbers.');
      }
      return `geo:${lat},${lng}`;
    }

    case "event":
      return buildEvent(data);

    case "whatsapp": {
      const phone = ensureString(data?.phone, "data.phone");
      const text = data?.text ? encodeURIComponent(data.text) : "";
      return `https://wa.me/${phone}?text=${text}`;
    }

    default:
      throw new Error("Unsupported payload type.");
  }
}

module.exports = {
  buildQrPayload,
  SUPPORTED_TYPES,
};

