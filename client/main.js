const form = document.getElementById("qr-form");
const statusElement = document.getElementById("status");
const resultElement = document.getElementById("result");
const imageElement = document.getElementById("qr-image");
const downloadLink = document.getElementById("download-link");
const typeElement = document.getElementById("type");
const inputElement = document.getElementById("data-input");
const formatHelpElement = document.getElementById("format-help");
const resolutionPresetElement = document.getElementById("resolution-preset");
const errorLevelElement = document.getElementById("error-level");
const marginElement = document.getElementById("margin");
const colorDarkElement = document.getElementById("color-dark");
const colorLightElement = document.getElementById("color-light");
const logoUrlElement = document.getElementById("logo-url");
const logoFileElement = document.getElementById("logo-file");
const logoSizeRatioElement = document.getElementById("logo-size-ratio");
const logoPaddingElement = document.getElementById("logo-padding");
const logoBgColorElement = document.getElementById("logo-bg-color");

const TYPE_HELP = {
  text: "Формат: любой текст",
  url: "Формат: https://example.com",
  email: "Формат: email|subject|body",
  phone: "Формат: +79990000000",
  sms: "Формат: phone|message",
  wifi: "Формат: ssid|password|WPA|false",
  vcard: "Формат: fullName|phone|email|organization|title|url|address|note",
  geo: "Формат: lat,lng (например 55.7558,37.6176)",
  event: "Формат: title|startISO|endISO|location|description",
  whatsapp: "Формат: phone|message",
};

const TYPE_DEFAULT_INPUT = {
  text: "Hello QR",
  url: "https://example.com",
  email: "user@example.com|Hello|Message",
  phone: "+79990000000",
  sms: "+79990000000|Hello",
  wifi: "MyWiFi|supersecret|WPA|false",
  vcard: "John Smith|+79990000000|john@example.com|My Co|CEO|https://example.com|City, Street|Contact",
  geo: "55.7558,37.6176",
  event: "Meeting|2026-05-01T10:00:00Z|2026-05-01T11:00:00Z|Office|Weekly sync",
  whatsapp: "79990000000|Hello",
};

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("error", isError);
}

function splitByPipe(value) {
  return String(value)
    .split("|")
    .map((part) => part.trim());
}

function buildDataByType(type, rawInput) {
  const input = String(rawInput || "").trim();
  if (!input) {
    throw new Error("Поле Data не может быть пустым.");
  }

  switch (type) {
    case "text":
      return { value: input };
    case "url":
      return { url: input };
    case "email": {
      const [email, subject = "", body = ""] = splitByPipe(input);
      return { email, subject, body };
    }
    case "phone":
      return { phone: input };
    case "sms": {
      const [phone, message = ""] = splitByPipe(input);
      return { phone, message };
    }
    case "wifi": {
      const [ssid, password = "", security = "WPA", hidden = "false"] = splitByPipe(input);
      return { ssid, password, security, hidden: hidden.toLowerCase() === "true" };
    }
    case "vcard": {
      const [fullName, phone = "", email = "", organization = "", title = "", url = "", address = "", note = ""] =
        splitByPipe(input);
      return { fullName, phone, email, organization, title, url, address, note };
    }
    case "geo": {
      const [latRaw, lngRaw] = input.split(",");
      const lat = Number(String(latRaw || "").trim());
      const lng = Number(String(lngRaw || "").trim());
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error("Для geo используй формат lat,lng.");
      }
      return { lat, lng };
    }
    case "event": {
      const [title, start, end, location = "", description = ""] = splitByPipe(input);
      return { title, start, end, location, description };
    }
    case "whatsapp": {
      const [phone, text = ""] = splitByPipe(input);
      return { phone, text };
    }
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

function resolveApiUrl() {
  const publicBaseUrl = window.__APP_CONFIG__?.publicBaseUrl || "";
  if (publicBaseUrl) {
    return `${publicBaseUrl}/api/v1/qr/generate`;
  }
  return "/api/v1/qr/generate";
}

function applyTypeHelp(type) {
  formatHelpElement.textContent = TYPE_HELP[type] || "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл логотипа."));
    reader.readAsDataURL(file);
  });
}

async function buildOptions() {
  const options = {
    resolutionPreset: resolutionPresetElement.value,
    margin: Number(marginElement.value || 2),
    errorCorrectionLevel: errorLevelElement.value,
    colorDark: colorDarkElement.value,
    colorLight: colorLightElement.value,
  };

  const logoUrl = String(logoUrlElement.value || "").trim();
  const logoFile = logoFileElement.files && logoFileElement.files[0] ? logoFileElement.files[0] : null;
  const sizeRatio = Number(logoSizeRatioElement.value || 0.2);
  const padding = Number(logoPaddingElement.value || 8);
  const backgroundColor = logoBgColorElement.value;

  if (logoUrl || logoFile) {
    options.logo = {
      sizeRatio,
      padding,
      backgroundColor,
    };

    if (logoFile) {
      options.logo.base64 = await readFileAsDataUrl(logoFile);
    } else {
      options.logo.url = logoUrl;
    }
  }

  return options;
}

typeElement.addEventListener("change", () => {
  const type = typeElement.value;
  inputElement.value = TYPE_DEFAULT_INPUT[type] || "";
  applyTypeHelp(type);
});

applyTypeHelp(typeElement.value);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  setStatus("Generating...");
  resultElement.classList.add("hidden");

  const apiUrl = resolveApiUrl();
  const type = typeElement.value;
  const input = inputElement.value;

  try {
    const data = buildDataByType(type, input);
    const options = await buildOptions();
    const body = { type, data, options };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Request failed: ${response.status}`);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    imageElement.src = imageUrl;
    downloadLink.href = imageUrl;
    resultElement.classList.remove("hidden");
    setStatus("QR generated successfully.");
  } catch (error) {
    setStatus(error.message || "Failed to generate QR.", true);
  }
});
