const axios = require("axios");

function isBase64DataUrl(value) {
  return /^data:image\/[a-zA-Z+]+;base64,/.test(value || "");
}

async function downloadLogoBuffer(logo) {
  if (!logo) return null;

  if (logo.base64 && isBase64DataUrl(logo.base64)) {
    const base64Part = logo.base64.split(",")[1];
    return Buffer.from(base64Part, "base64");
  }

  if (logo.url) {
    const response = await axios.get(logo.url, {
      responseType: "arraybuffer",
      timeout: 10000,
      maxContentLength: 2 * 1024 * 1024,
    });
    return Buffer.from(response.data);
  }

  return null;
}

module.exports = {
  downloadLogoBuffer,
};

