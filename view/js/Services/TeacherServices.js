import { API_BASE_URL } from '../utils/constants.js';


/**
 * Mengambil daftar siswa dari API, dengan opsi filter berdasarkan kelas.
 * @param {string|number} classId - ID kelas untuk filter (opsional).
 * @returns {Promise<Array>} Array yang berisi objek-objek siswa.
 */
export async function getMyStudents(classId = '') {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
    }

    // Tentukan URL endpoint
    let apiUrl = `${API_BASE_URL}/api/teacher/students`;

    // Jika ada classId yang diberikan, tambahkan sebagai query parameter
    if (classId) {
        apiUrl += `?class_id=${classId}`;
    }

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Gagal mengambil daftar siswa dari server.");
        }

        if (result.status === 'success' && Array.isArray(result.students)) {
            return result.students;
        } else {
            throw new Error(result.message || "Format respons dari server tidak valid.");
        }

    } catch (error) {
        console.error(`Terjadi kesalahan di dalam fungsi getMyStudents (classId: ${classId}):`, error.message);
        throw error;
    }
}