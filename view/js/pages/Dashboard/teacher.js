import { getMyStudents } from "../../Services/TeacherServices.js";
import { getUserData } from "../../Services/AuthServices.js"; // Diperlukan untuk mendapat info kelas
import { fetchEmotionFrequencyTrend } from "../../Services/EmotionDetectionServices.js";
import { createReport } from "../../Services/ReportServices.js";
import { renderFrequencyTrendLineChart } from "../../utils/chart_renderer.js";
import { API_BASE_URL } from "../../utils/constants.js";

let selectedStudent = null;
let historyChartInstance = null;

const DEFAULT_AVATAR_PATH = "/public/img/default-avatar.jpg";

const getStudentPhotoUrl = (photoFilename) => {
  if (!photoFilename) return DEFAULT_AVATAR_PATH;

  if (photoFilename.startsWith("http://") || photoFilename.startsWith("https://")) {
    return photoFilename;
  }

  // ✅ Jangan pakai API_BASE_URL karena route file bukan melalui /api
  return `https://m00thzqr-5173.asse.devtunnels.ms/profile/${photoFilename}`;
};



/**
 * Fungsi inisialisasi utama untuk modul dashboard pengajar.
 */
export async function init() {
  console.log("Inisialisasi modul dashboard PENGAJAR.");

  setupModalTriggers();
  
  // Langsung panggil fungsi utama untuk memuat data
  fetchAndRenderTeacherData(); 
}

/**
 * Fungsi utama baru untuk mengambil semua data yang relevan untuk guru.
 */
async function fetchAndRenderTeacherData() {
    const studentListContainer = document.getElementById("student-list-container");
    const classFilterElement = document.getElementById("class-filter"); // Element untuk menampilkan nama kelas
    
    if (!studentListContainer || !classFilterElement) {
        console.error("Elemen penting untuk dasbor guru tidak ditemukan.");
        return;
    }
  
    studentListContainer.innerHTML = `<div class="p-3 text-gray-500 animate-pulse">Memuat data kelas dan siswa...</div>`;
    
    try {
        // Ambil data siswa yang dibimbing oleh guru ini
        const students = await getMyStudents();
        renderStudentList(students);
        
        // Dapatkan data kelas dari siswa pertama (karena semua siswa ada di kelas yang sama)
        // atau bisa juga dari data guru jika endpoint-nya diupdate.
        if (students && students.length > 0 && students[0].class) {
            // Daripada filter, kita tampilkan saja nama kelasnya sebagai judul
            classFilterElement.innerHTML = `<h3 class="text-lg font-semibold text-gray-700">Kelas Bimbingan: ${students[0].class.name}</h3>`;
        } else {
            classFilterElement.innerHTML = `<p class="text-gray-500">Anda belum menjadi wali kelas.</p>`;
        }

    } catch (error) {
        console.error("Gagal mengambil atau merender data guru:", error);
        studentListContainer.innerHTML = `
            <div class="p-3 text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <strong>Oops! Terjadi kesalahan.</strong>
                <p class="text-sm mt-1">${error.message || "Tidak dapat memuat daftar siswa."}</p>
            </div>
        `;
        classFilterElement.innerHTML = ''; // Kosongkan area kelas jika error
    }
}


/**
 * Merender daftar siswa ke dalam kolom kiri di UI.
 * (Fungsi ini tidak perlu banyak perubahan)
 */
function renderStudentList(students) {
  const container = document.getElementById("student-list-container");
  container.innerHTML = "";

  if (!students || students.length === 0) {
    container.innerHTML = '<p class="p-3 text-gray-500">Tidak ada siswa di kelas Anda.</p>';
    // Sembunyikan detail view jika tidak ada siswa
    document.getElementById("student-detail-container").classList.add("hidden");
    document.getElementById("select-student-prompt").classList.remove("hidden");
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

// ===================================================================
// Sisa fungsi (handleStudentSelect, setupModalTriggers, dll.)
// TIDAK PERLU DIUBAH sama sekali dan bisa tetap menggunakan kode lama Anda.
// Saya akan menyertakan fungsi-fungsi tersebut di sini untuk kelengkapan.
// ===================================================================

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
  photoEl.src = getStudentPhotoUrl(selectedStudent.photo);
}

function setupModalTriggers() {
  document.getElementById("profile-section").addEventListener("click", openProfileModal);
  document.getElementById("show-history-modal-btn").addEventListener("click", openHistoryModal);
  document.getElementById("show-report-modal-btn").addEventListener("click", openReportModal);
  document.getElementById("close-profile-modal-btn").addEventListener("click", () => document.getElementById("profile-modal").classList.add("hidden"));
  document.getElementById("close-history-modal-btn").addEventListener("click", () => document.getElementById("history-modal").classList.add("hidden"));
  document.getElementById("close-report-modal-btn").addEventListener("click", () => document.getElementById("report-modal").classList.add("hidden"));

  document.querySelectorAll(".history-period-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const allPeriodButtons = document.querySelectorAll(".history-period-btn");
      allPeriodButtons.forEach((b) => {
        b.classList.remove("bg-blue-600", "text-white");
        b.classList.add("bg-gray-300", "text-gray-800");
      });
      const clickedButton = e.target;
      clickedButton.classList.remove("bg-gray-300", "text-gray-800");
      clickedButton.classList.add("bg-blue-600", "text-white");
      fetchAndRenderHistoryChart(clickedButton.dataset.period);
    });
  });

  document.getElementById("generate-report-btn-final").addEventListener("click", handleReportGeneration);
}

function openProfileModal() {
  if (!selectedStudent) return;
  document.getElementById("modal-student-name").textContent = selectedStudent.name;
  document.getElementById("modal-student-email").textContent = selectedStudent.email;
  document.getElementById("modal-student-kelas").textContent = selectedStudent.class ? selectedStudent.class.name : "Belum diatur";

  const photoEl = document.getElementById("modal-student-photo");
  photoEl.onerror = () => { photoEl.onerror = null; photoEl.src = DEFAULT_AVATAR_PATH; };
  
  // ✅ GANTI INI
  photoEl.src = getStudentPhotoUrl(selectedStudent.photo); // bukan selectedStudent.photo_url
  
  document.getElementById("profile-modal").classList.remove("hidden");
}


function openHistoryModal() {
  if (!selectedStudent) return;
  document.getElementById("history-student-name").textContent = selectedStudent.name;
  document.getElementById("history-modal").classList.remove("hidden");
  document.querySelector('.history-period-btn[data-period="weekly"]').click();
}

async function fetchAndRenderHistoryChart(period) {
    if (!selectedStudent) return;
    const chartContainer = document.getElementById("history-chart-container");
    chartContainer.innerHTML = `<p id="history-loading-text" class="text-gray-500 animate-pulse">Memuat data grafik...</p>`;
    if (historyChartInstance) historyChartInstance.destroy();

    try {
        const endDate = new Date();
        const startDate = new Date();
        period === "weekly" ? startDate.setDate(endDate.getDate() - 6) : startDate.setMonth(endDate.getMonth() - 1);
        const formattedStartDate = startDate.toISOString().split("T")[0];
        const formattedEndDate = endDate.toISOString().split("T")[0];
        const historyData = await fetchEmotionFrequencyTrend(formattedStartDate, formattedEndDate, selectedStudent.id);

        chartContainer.innerHTML = `<canvas id="history-chart-canvas"></canvas>`;
        const canvas = document.getElementById("history-chart-canvas");
        if (!canvas) throw new Error("Canvas element not found");

        if (historyData.chartJsFormat && historyData.chartJsFormat.labels.length > 0) {
            historyChartInstance = renderFrequencyTrendLineChart(canvas.id, historyData.chartJsFormat);
        } else {
            chartContainer.innerHTML = `<p class="text-center text-gray-500 py-16">Tidak ada data emosi ditemukan untuk periode ini.</p>`;
        }
    } catch (error) {
        console.error(`Gagal memuat history (${period}):`, error);
        chartContainer.innerHTML = `<p class="text-center text-red-500 py-16">Gagal memuat data grafik: ${error.message}</p>`;
    }
}

function openReportModal() {
  if (!selectedStudent) return;
  document.getElementById("report-student-name").textContent = selectedStudent.name;
  document.getElementById("report-start-date").value = "";
  document.getElementById("report-end-date").value = "";
  document.getElementById("report-modal").classList.remove("hidden");
}

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
    const hiddenCanvasId = "hidden-chart-canvas";
    const hiddenCanvas = document.getElementById(hiddenCanvasId);
    if (!hiddenCanvas) throw new Error("Hidden canvas not found");
    
    if (trendData?.chartJsFormat?.datasets.length > 0) {
      renderFrequencyTrendLineChart(hiddenCanvasId, trendData.chartJsFormat);
      await new Promise(resolve => setTimeout(resolve, 200));
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
