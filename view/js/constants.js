// Frontend/view/js/constants.js

export const MODEL_PATH = "/public/models"; // Path relatif dari root server Anda
export const API_URL = "http://localhost:8000/api/detect-emotion"; // Ganti dengan URL API Lumen Anda
export const JWT_TOKEN_KEY = "jwt_token"; // Kunci untuk menyimpan JWT di localStorage

export const CHART_COLORS = {
    neutral: "rgba(255, 193, 7, 0.8)",
    happy: "rgba(76, 175, 80, 0.8)",
    sad: "rgba(3, 169, 244, 0.8)",
    angry: "rgba(244, 67, 54, 0.8)",
    fearful: "rgba(156, 39, 176, 0.8)",
    surprised: "rgba(255, 87, 34, 0.8)",
    disgusted: "rgba(96, 125, 139, 0.8)",
};
export const BORDER_COLORS = {
    neutral: "rgba(255, 193, 7, 1)",
    happy: "rgba(76, 175, 80, 1)",
    sad: "rgba(3, 169, 244, 1)",
    angry: "rgba(244, 67, 54, 1)",
    fearful: "rgba(156, 39, 176, 1)",
    surprised: "rgba(255, 87, 34, 1)",
    disgusted: "rgba(96, 125, 139, 1)",
};