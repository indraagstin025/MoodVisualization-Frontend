// File: public/js/Services/ClassServices.js

import { API_BASE_URL } from '../utils/constants.js';

// Fungsi helper untuk mendapatkan token dari localStorage
function getAuthToken() {
    return localStorage.getItem('jwt_token');
}

export async function getAllClasses() {
    const token = getAuthToken();
    if (!token) throw new Error("Akses ditolak. Token tidak ditemukan.");

    try {
        // PERBAIKAN: Panggil endpoint /api/classes yang bisa diakses semua role
        const response = await fetch(`${API_BASE_URL}/api/classes`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
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
export async function createClass(className) {
    const token = getAuthToken();
    if (!token) throw new Error("Akses ditolak. Token tidak ditemukan.");

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/classes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: className })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.errors?.name?.[0] || result.message || "Gagal membuat kelas.");
        return result;
    } catch (error) {
        console.error("Error in createClass:", error);
        throw error;
    }
}