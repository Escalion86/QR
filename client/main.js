const form = document.getElementById("qr-form");
const statusElement = document.getElementById("status");
const resultElement = document.getElementById("result");
const imageElement = document.getElementById("qr-image");
const downloadLink = document.getElementById("download-link");

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("error", isError);
}

function parseJsonField(rawValue, fieldName) {
  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    throw new Error(`Invalid JSON in "${fieldName}".`);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  setStatus("Generating...");
  resultElement.classList.add("hidden");

  const apiUrl = document.getElementById("api-url").value.trim();
  const type = document.getElementById("type").value;
  const dataRaw = document.getElementById("data-json").value;
  const optionsRaw = document.getElementById("options-json").value;

  try {
    const data = parseJsonField(dataRaw, "Data");
    const options = parseJsonField(optionsRaw, "Options");
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

