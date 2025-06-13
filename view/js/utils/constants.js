// File: utils/constants.js

// Satu-satunya tempat Anda perlu mengubah URL jika server pindah
export const API_BASE_URL = "http://localhost:8000";

export const MODEL_PATH = "/public/models"; 
export const JWT_TOKEN_KEY = "jwt_token";

// --- API Endpoints ---
// Dibangun dari API_BASE_URL agar konsisten
export const API_URL_EMOTION_RECORDS = `${API_BASE_URL}/api/emotion-records`;
export const API_URL_EMOTION_HISTORY_SUMMARY = `${API_BASE_URL}/api/emotion/history/summary`;
export const API_URL_EMOTION_HISTORY_FREQUENCY_TREND = `${API_BASE_URL}/api/emotion/history/trend`;

// PENAMBAHAN BARU (Wajib untuk fitur dashboard pengajar)
// Ini adalah URL dasar untuk semua endpoint yang berhubungan dengan data siswa spesifik
export const API_URL_STUDENT_EMOTION_HISTORY = `${API_BASE_URL}/api/students`;


// --- Charting Constants ---
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