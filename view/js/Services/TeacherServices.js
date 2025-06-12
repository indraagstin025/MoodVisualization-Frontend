import { API_BASE_URL } from '../utils/constants.js';

/**
 * Mengambil daftar siswa dari API backend.
 * Fungsi ini memerlukan token otentikasi untuk pengajar yang sedang login.
 * @returns {Promise<Array>} Array yang berisi objek-objek siswa.
 */
export async function getMyStudents() {
    // Anda menggunakan 'jwt_token'. Pastikan kunci ini konsisten
    // dengan yang Anda simpan saat login.
    const token = localStorage.getItem('jwt_token');

    if (!token) {
        // Melempar error agar dapat ditangkap oleh fungsi yang memanggil.
        throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/my-students`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                // Header Authorization sudah benar
                "Authorization": `Bearer ${token}`,
            },
        });

        const result = await response.json();

        // Jika respons server tidak OK (misal: error 403, 404, 500)
        if (!response.ok) {
            // Gunakan pesan error dari backend jika ada, jika tidak, gunakan pesan default.
            throw new Error(result.message || "Gagal mengambil daftar siswa dari server.");
        }

        // **PENYESUAIAN PENTING ADA DI SINI**
        // Kembalikan array 'students' dari dalam objek respons, bukan seluruh objeknya.
        if (result.status === 'success' && result.students) {
            return result.students;
        } else {
            // Jika status bukan 'success' atau properti 'students' tidak ada
            throw new Error(result.message || "Format respons dari server tidak valid.");
        }

    } catch (error) {
        // Log error untuk debugging dan lempar kembali agar bisa ditangani di UI.
        console.error("Terjadi kesalahan di dalam fungsi getMyStudents:", error.message);
        throw error;
    }
}
