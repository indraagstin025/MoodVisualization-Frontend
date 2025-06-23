import { API_BASE_URL } from "../utils/constants.js";

function getAuthToken() {
  return localStorage.getItem("jwt_token");
}

export async function getAllClasses() {
  const token = getAuthToken();
  if (!token) throw new Error("Akses ditolak. Token tidak ditemukan.");

  try {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "ngrok-skip-browser-warning": "true", // Ditambahkan di sini
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal mengambil daftar kelas.");
    return result.classes;
  } catch (error) {
    console.error("Error in getAllClasses:", error);
    throw error;
  }
}

/**
 * Membuat kelas baru. (Hanya untuk Admin)
 * @param {string} className Nama kelas yang akan dibuat.
 * @returns {Promise<Object>} Objek kelas yang baru dibuat.
 */
export async function createClass(classData) { // <-- SEKARANG MENERIMA OBJEK 'classData'
  const token = getAuthToken();
  if (!token) throw new Error("Akses ditolak. Silakan login kembali.");

  const response = await fetch(`${API_BASE_URL}/api/admin/classes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true", // Ditambahkan di sini
    },
    // Langsung kirim objek yang diterima dari admin.js
    body: JSON.stringify(classData) 
  });

  const result = await response.json();

  if (!response.ok) {
    // Menangani error validasi dari backend dengan lebih baik
    if (result.errors) {
      // Ambil pesan error pertama (misalnya dari field 'name')
      const firstError = Object.values(result.errors)[0][0];
      throw new Error(firstError || 'Data yang diberikan tidak valid.');
    }
    throw new Error(result.message || 'Gagal membuat kelas baru.');
  }

  return result.class;
}