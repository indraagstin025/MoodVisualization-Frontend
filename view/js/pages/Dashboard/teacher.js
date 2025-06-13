/**
 * teacher.js - Logika untuk Dashboard Pengajar
 * File ini mengelola semua interaksi di dashboard pengajar, termasuk:
 * - Menampilkan daftar siswa
 * - Memfilter siswa berdasarkan kelas
 * - Menampilkan detail, history, dan laporan untuk siswa yang dipilih
 */


import { getMyStudents } from "../../Services/TeacherServices.js";

import { fetchEmotionFrequencyTrend } from "../../Services/EmotionDetectionServices.js";

import { createReport } from "../../Services/ReportServices.js";

import { renderFrequencyTrendLineChart } from "../../utils/chart_renderer.js";
import { API_BASE_URL } from "../../utils/constants.js";




let selectedStudent = null;
let historyChartInstance = null;

// Pastikan jalur ini benar relatif terhadap root server frontend Anda (127.0.0.1:5501)
const DEFAULT_AVATAR_PATH = "/public/img/default-avatar.jpg"; 

/**
 * Helper function to construct the full URL for student photos.
 * Checks if the photo path is already an absolute URL; otherwise, constructs it.
 * @param {string} photoFilename - The filename of the photo from the backend (e.g., "1749830304.jpg").
 * @returns {string} The full absolute URL to the student's photo or default avatar path.
 */
const getStudentPhotoUrl = (photoFilename) => {
    if (photoFilename) {
        // Check if it's already a full URL (starts with http/https)
        if (photoFilename.startsWith('http://') || photoFilename.startsWith('https://')) {
            return photoFilename;
        }
        // Otherwise, assume it's just the filename and construct the full URL
        // Assuming photos are served from /profile/ directory on the backend
        return `${API_BASE_URL}/profile/${photoFilename}`;
    }
    return DEFAULT_AVATAR_PATH;
};


/**
 * Fungsi inisialisasi utama untuk modul dashboard pengajar.
 * Dipanggil oleh dashboard.js setelah konten HTML dimuat.
 */
export async function init() {
    console.log("Inisialisasi modul dashboard PENGAJAR.");

    setupModalTriggers();

    document.getElementById("class-filter").addEventListener("change", (e) => {
        fetchAndRenderStudents(e.target.value);
    });

    fetchAndRenderStudents();
}

/**
 * Mengambil data siswa dari API dan memicu proses rendering.
 * Fungsi ini juga menangani filter berdasarkan kelas.
 * @param {string|number} classId - ID kelas untuk filter (opsional).
 */
async function fetchAndRenderStudents(classId = "") {
    const studentListContainer = document.getElementById("student-list-container");
    studentListContainer.innerHTML = `<div class="p-3 text-gray-500 animate-pulse">Memuat daftar siswa...</div>`;

    try {
        const students = await getMyStudents(classId);
        renderStudentList(students);

        if (classId === "") {
            const allStudents = await getMyStudents();
            populateClassFilter(allStudents);
        }
    } catch (error) {
        console.error("Gagal mengambil atau merender siswa:", error);
        studentListContainer.innerHTML = `
            <div class="p-3 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <strong>Oops! Terjadi kesalahan.</strong>
                <p class="text-sm mt-1">${error.message || "Tidak dapat memuat daftar siswa."}</p>
            </div>
        `;
    }
}

/**
 * Merender daftar siswa ke dalam kolom kiri di UI.
 * @param {Array<Object>} students - Array objek siswa dari API.
 */
function renderStudentList(students) {
    const container = document.getElementById("student-list-container");
    container.innerHTML = "";

    if (!students || students.length === 0) {
        container.innerHTML = '<p class="p-3 text-gray-500">Tidak ada siswa ditemukan.</p>';
        return;
    }

    students.forEach((student) => {
        const studentItem = document.createElement("div");
        studentItem.className = "p-3 rounded-lg hover:bg-green-50 cursor-pointer border flex items-center gap-3 transition-colors duration-200";
        studentItem.innerHTML = `
            <img src="${getStudentPhotoUrl(student.photo)}" 
                 alt="Foto ${student.name}" 
                 class="w-10 h-10 rounded-full object-cover"
                 onerror="this.onerror=null;this.src='${DEFAULT_AVATAR_PATH}';">
            <span class="font-medium text-gray-700">${student.name}</span>
        `;

        studentItem.addEventListener("click", () => {
            document.querySelectorAll("#student-list-container > div").forEach((el) => el.classList.remove("bg-green-100", "border-green-400"));
            studentItem.classList.add("bg-green-100", "border-green-400");
            handleStudentSelect(student);
        });

        container.appendChild(studentItem);
    });
}

/**
 * Menangani logika saat seorang siswa dipilih dari daftar.
 * @param {Object} student - Objek data siswa yang dipilih.
 */
function handleStudentSelect(student) {
    console.log("Data siswa yang di-klik:", student);
    selectedStudent = student;

    document.getElementById("student-detail-container").classList.remove("hidden");
    document.getElementById("select-student-prompt").classList.add("hidden");

    document.getElementById("student-profile-name").textContent = student.name;
    const photoEl = document.getElementById("student-profile-photo");
    photoEl.onerror = () => {
        photoEl.onerror = null;
        photoEl.src = DEFAULT_AVATAR_PATH;
    };
    // Menggunakan helper function untuk mendapatkan URL yang benar
    photoEl.src = getStudentPhotoUrl(selectedStudent.photo);
}

/**
 * Mengisi dropdown filter dengan daftar kelas yang unik.
 * @param {Array<Object>} students - Array berisi semua siswa untuk mendapatkan daftar kelas.
 */
function populateClassFilter(students) {
    const filterSelect = document.getElementById("class-filter");
    const existingClasses = new Map();

    students.forEach((student) => {
        if (student.class && !existingClasses.has(student.class.id)) {
            existingClasses.set(student.class.id, student.class.name);
        }
    });

    const selectedValue = filterSelect.value;
    filterSelect.innerHTML = '<option value="">Semua Kelas</option>';
    

    for (const [id, name] of existingClasses.entries()) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = name;
        filterSelect.appendChild(option);
    }

    filterSelect.value = selectedValue;
}

/**
 * Mengatur semua event listener untuk membuka dan menutup modal.
 */
function setupModalTriggers() {
    document.getElementById("profile-section").addEventListener("click", openProfileModal);
    document.getElementById("show-history-modal-btn").addEventListener("click", openHistoryModal);
    document.getElementById("show-report-modal-btn").addEventListener("click", openReportModal);
    document.getElementById("close-profile-modal-btn").addEventListener("click", () => document.getElementById("profile-modal").classList.add("hidden"));
    document.getElementById("close-history-modal-btn").addEventListener("click", () => document.getElementById("history-modal").classList.add("hidden"));
    document.getElementById("close-report-modal-btn").addEventListener("click", () => document.getElementById("report-modal").classList.add("hidden"));

    document.querySelectorAll(".history-period-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".history-period-btn").forEach((b) => {
                b.classList.replace("bg-blue-500", "bg-gray-200");
                b.classList.replace("text-white", "text-gray-700");
            });
            e.target.classList.add("bg-blue-500", "text-white");
            e.target.classList.remove("bg-gray-200", "text-gray-700");
            fetchAndRenderHistoryChart(e.target.dataset.period);
        });
    });

    document.getElementById("generate-report-btn-final").addEventListener("click", handleReportGeneration);
}

/**
 * Membuka modal profil dan mengisinya dengan data siswa yang dipilih.
 */
function openProfileModal() {
    if (!selectedStudent) return;
    document.getElementById("modal-student-name").textContent = selectedStudent.name;
    document.getElementById("modal-student-email").textContent = selectedStudent.email;
    document.getElementById("modal-student-kelas").textContent = selectedStudent.class ? selectedStudent.class.name : "Belum diatur";

    const photoEl = document.getElementById("modal-student-photo");
    photoEl.onerror = () => {
        photoEl.onerror = null;
        photoEl.src = DEFAULT_AVATAR_PATH;
    };
    // Menggunakan helper function untuk mendapatkan URL yang benar
    photoEl.src = getStudentPhotoUrl(selectedStudent.photo);

    document.getElementById("profile-modal").classList.remove("hidden");
}

/**
 * Membuka modal history dan memicu pemuatan grafik.
 */
function openHistoryModal() {
    if (!selectedStudent) return;
    document.getElementById("history-student-name").textContent = selectedStudent.name;
    document.getElementById("history-modal").classList.remove("hidden");
    document.querySelector('.history-period-btn[data-period="weekly"]').click();
}

/**
 * Mengambil data dan merender grafik history emosi.
 * @param {string} period - 'weekly' atau 'monthly'.
 */
async function fetchAndRenderHistoryChart(period) {
    if (!selectedStudent) {
        console.error("fetchAndRenderHistoryChart dipanggil tanpa ada siswa yang dipilih.");
        return;
    }

    const chartContainer = document.getElementById("history-chart-container");
    chartContainer.innerHTML = `<p id="history-loading-text" class="text-gray-500 animate-pulse">Memuat data grafik...</p>`;

    if (historyChartInstance) {
        historyChartInstance.destroy();
        historyChartInstance = null;
    }

    try {
        const endDate = new Date();
        const startDate = new Date();
        period === "weekly" ? startDate.setDate(endDate.getDate() - 6) : startDate.setMonth(endDate.getMonth() - 1);

        const formattedStartDate = startDate.toISOString().split("T")[0];
        const formattedEndDate = endDate.toISOString().split("T")[0];

        const historyData = await fetchEmotionFrequencyTrend(formattedStartDate, formattedEndDate, selectedStudent.id);

        chartContainer.innerHTML = `<canvas id="history-chart-canvas"></canvas>`;
        const canvas = document.getElementById("history-chart-canvas");

        if (!canvas) {
            console.error("Elemen canvas 'history-chart-canvas' tidak ditemukan setelah dibuat.");
            chartContainer.innerHTML = `<p class="text-center text-red-500 py-16">Terjadi masalah saat membuat area grafik.</p>`;
            return;
        }

        if (historyData.chartJsFormat && historyData.chartJsFormat.labels.length > 0) {
            // Menggunakan ID string kanvas
            historyChartInstance = renderFrequencyTrendLineChart(canvas.id, historyData.chartJsFormat, historyChartInstance);
        } else {
            chartContainer.innerHTML = `<p class="text-center text-gray-500 py-16">Tidak ada data emosi ditemukan untuk periode ini.</p>`;
        }
    } catch (error) {
        console.error(`Gagal memuat history (${period}):`, error);
        chartContainer.innerHTML = `<p class="text-center text-red-500 py-16">Gagal memuat data grafik: ${error.message}</p>`;
    }
}

/**
 * Membuka modal untuk membuat laporan.
 */
function openReportModal() {
    if (!selectedStudent) return;
    document.getElementById("report-student-name").textContent = selectedStudent.name;
    document.getElementById("report-start-date").value = "";
    document.getElementById("report-end-date").value = "";
    document.getElementById("report-modal").classList.remove("hidden");
}

/**
 * Menangani proses pembuatan laporan saat tombol di modal diklik.
 */
async function handleReportGeneration() {
    if (!selectedStudent) return;

    const startDate = document.getElementById("report-start-date").value;
    const endDate = document.getElementById("report-end-date").value;

    if (!startDate || !endDate) {
        Swal.fire("Data Tidak Lengkap", "Harap tentukan rentang tanggal laporan.", "warning");
        return;
    }

    const btn = document.getElementById("generate-report-btn-final");
    btn.disabled = true;
    btn.textContent = "Memproses...";

    try {
        const trendData = await fetchEmotionFrequencyTrend(startDate, endDate, selectedStudent.id);
        let chartImageBase64 = null;

        // Penting: Pastikan ada elemen hidden canvas dengan ID 'hidden-chart-canvas' di HTML Anda
        // Misalnya: <canvas id="hidden-chart-canvas" style="display:none;"></canvas>
        const hiddenCanvasId = "hidden-chart-canvas";
        const hiddenCanvas = document.getElementById(hiddenCanvasId);

        if (!hiddenCanvas) {
            console.error(`Elemen canvas tersembunyi dengan ID '${hiddenCanvasId}' tidak ditemukan.`);
            Swal.fire("Gagal", "Elemen grafik tersembunyi tidak ditemukan.", "error");
            return;
        }

        if (trendData && trendData.chartJsFormat && trendData.chartJsFormat.datasets.length > 0) {
            // Render chart ke hidden canvas menggunakan ID string
            renderFrequencyTrendLineChart(hiddenCanvasId, trendData.chartJsFormat);
            // Memberi sedikit waktu agar chart selesai di-render sebelum diambil datanya
            await new Promise((resolve) => setTimeout(resolve, 200));
            chartImageBase64 = hiddenCanvas.toDataURL("image/png");
        }

        const result = await createReport(selectedStudent.id, startDate, endDate, chartImageBase64);

        Swal.fire("Berhasil!", result.message || "Laporan berhasil dibuat.", "success");
        document.getElementById("report-modal").classList.add("hidden");
    } catch (error) {
        console.error("Gagal membuat laporan:", error);
        Swal.fire("Gagal", error.message || "Terjadi kesalahan saat membuat laporan.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Buat & Simpan Laporan";
    }
}
