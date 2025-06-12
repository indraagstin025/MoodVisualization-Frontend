// Menggunakan pola yang sama seperti AuthServices.js
import { API_BASE_URL } from '../utils/constants.js';


/**
 * Membuat laporan baru untuk seorang siswa.
 * @param {number} studentId 
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {Promise<Object>} Respons dari API.
 */
export async function createReport(studentId, startDate, endDate, chartImageBase64) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error("Token otentikasi tidak ditemukan.");
    }

    const reportData = {
        student_id: studentId,
        start_date: startDate,
        end_date: endDate,
        chart_image_base64: chartImageBase64 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(reportData)
        });

        const result = await response.json();

        if (!response.ok) {
            let errorMessage = "Gagal membuat laporan.";
            if (result.errors) {
                errorMessage = Object.values(result.errors).flat().join(' ');
            } else if (result.message) {
                errorMessage = result.message;
            }
            throw new Error(errorMessage);
        }

        return result;
    } catch (error) {
        console.error("Error in createReport:", error);
        throw error;
    }
}

/**
 * Mengambil daftar laporan untuk murid yang sedang login.
 * @returns {Promise<Object>} Respons dari API.
 */
export async function listMyReports() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error("Token otentikasi tidak ditemukan.");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/my-reports`, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Gagal mengambil daftar laporan.");
        }
        return result;
    } catch (error) {
        console.error("Error in listMyReports:", error);
        throw error;
    }
}

/**
 * Mengunduh file laporan PDF.
 * @param {number} reportId 
 */
export async function downloadReport(reportId) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error("Token otentikasi tidak ditemukan.");
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/reports/download/${reportId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Gagal mengunduh file laporan.');
        }

        const filename = `laporan-emosi-${reportId}.pdf`;
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error in downloadReport:', error);
        throw error;
    }
}