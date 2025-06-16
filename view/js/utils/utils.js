export function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function capitalizeFirstLetter(string) {
  if (!string || typeof string !== "string") return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const emotionToEmojiMap = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😮",
  fearful: "😨",
  disgusted: "🤢",
  neutral: "😐",
  "tidak ada deteksi": "🚫",
  "tidak ada data": "❓",
  "tidak ada data skor": "❓",
  default: "🤔",
};

export function drawTextOnCanvas(canvasId, message, color = "#6b7280", fontSize = "16px") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`drawTextOnCanvas: Canvas element with id '${canvasId}' not found.`);
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn(`drawTextOnCanvas: Could not get 2D context for canvas '${canvasId}'.`);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize} Inter, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = message.split("\n");
  const lineHeight = parseInt(fontSize, 10) * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  let startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

  lines.forEach((line) => {
    ctx.fillText(line, canvas.width / 2, startY);
    startY += lineHeight;
  });
}