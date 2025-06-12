import { getLoggedInUser, logoutUser, createUserByAdmin, getAllUsersByAdmin, getUserData } from "../Services/AuthServices.js";
import { fetchEmotionFrequencyTrend, fetchEmotionSummaryForChart } from "../Services/EmotionDetectionServices.js";

import { getMyStudents } from "../Services/TeacherServices.js";
import { createReport, listMyReports, downloadReport } from "../Services/ReportServices.js";

import { getFormattedDate, capitalizeFirstLetter, emotionToEmojiMap, drawTextOnCanvas } from "../utils/utils.js";
import { renderFrequencyTrendLineChart, renderEmotionDistributionDoughnutChart } from "../utils/chart_renderer.js";

let analysisWeeklyTrendChartInstance = null;
let analysisEmotionDistributionChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.pathname.includes("dashboard.html")) return;
  console.log("Memulai skrip dashboard modular...");

  const user = getUserData();

  if (!user) {
    Swal.fire({
      title: "Sesi Tidak Ditemukan",
      text: "Anda harus login terlebih dahulu untuk mengakses dashboard.",
      icon: "warning",
      confirmButtonText: "Login Sekarang",
      allowOutsideClick: false,
    }).then(() => logoutUser());
    return;
  }

  initializeDashboard(user);
});

/**
 * Fungsi master yang mengorkestrasi seluruh penyiapan dashboard.
 * @param {Object} user - Objek pengguna dari localStorage.
 */
async function initializeDashboard(user) {
  console.log(`Menginisialisasi dashboard untuk: ${user.name} (Role: ${user.role})`);

  const welcomeHeading = document.getElementById("mainWelcomeHeading");
  if (welcomeHeading) {
    welcomeHeading.textContent = `Selamat Datang, ${capitalizeFirstLetter(user.role)} ${user.name}!`;
  }

  await loadRoleContent(user.role);

  initializeRoleSpecificScripts(user.role);
}

/**
 * Memuat konten HTML dari file parsial dan menyuntikkannya ke dalam wadah.
 * @param {string} role - Role pengguna (admin, pengajar, murid).
 */
async function loadRoleContent(role) {
  const container = document.getElementById("dashboard-content-container");
  if (!container) {
    console.error("Wadah #dashboard-content-container tidak ditemukan!");
    return;
  }

  let filePath;
  switch (role) {
    case "admin":
      filePath = "_admin_dashboard.html";
      break;
    case "pengajar":
      filePath = "_pengajar_dashboard.html";
      break;
    case "murid":
    default:
      filePath = "_murid_dashboard.html";
      break;
  }

  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Gagal memuat file: ${filePath}`);

    container.innerHTML = await response.text();
    console.log(`Konten untuk role '${role}' berhasil dimuat dari ${filePath}.`);
  } catch (error) {
    console.error("Error saat memuat konten role:", error);
    container.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error: Gagal memuat konten dashboard. Mohon refresh halaman.</div>`;
  }
}

/**
 * Menjalankan skrip yang relevan berdasarkan role pengguna.
 * PENTING: Fungsi ini dipanggil SETELAH innerHTML diatur.
 * @param {string} role
 */
function initializeRoleSpecificScripts(role) {
  console.log(`Menjalankan skrip spesifik untuk role: ${role}`);

  if (analysisWeeklyTrendChartInstance) analysisWeeklyTrendChartInstance.destroy();
  if (analysisEmotionDistributionChartInstance) analysisEmotionDistributionChartInstance.destroy();

  switch (role) {
    case "admin":
      const createUserForm = document.getElementById("createUserForm");
      if (createUserForm) {
        createUserForm.addEventListener("submit", handleCreateUserSubmit);
      }
      loadUserList();
      break;

    case "pengajar":
      setupTeacherDashboard();

      

      break;

    case "murid":
    default:
      loadOverviewData();
      loadAnalysisCharts();
      setupStudentDashboard();
      break;
  }
}

/**
 * Mempersiapkan semua event listener dan data untuk dashboard pengajar.
 */

async function setupTeacherDashboard() {
  const studentSelect = document.getElementById("student-select");
  const startDateInput = document.getElementById("start-date-input");
  const endDateInput = document.getElementById("end-date-input");
  const generateBtn = document.getElementById("generate-report-btn");
  const hiddenCanvas = document.getElementById("hidden-chart-canvas");

  if (!studentSelect || !generateBtn || !hiddenCanvas) {
    console.error("Elemen dashboard pengajar tidak ditemukan.");
    return;
  }

  studentSelect.disabled = true;
  generateBtn.disabled = true;
  try {
    const students = await getMyStudents();
    studentSelect.innerHTML = '<option value="">-- Pilih seorang siswa --</option>';
    if (students && students.length > 0) {
      students.forEach((student) => {
        const option = document.createElement("option");
        option.value = student.id;
        option.textContent = student.name;
        studentSelect.appendChild(option);
      });
      studentSelect.disabled = false;
      generateBtn.disabled = false;
    } else {
      studentSelect.innerHTML = '<option value="">Tidak ada siswa bimbingan</option>';
    }
  } catch (error) {
    console.error("Gagal memuat daftar siswa:", error);
    studentSelect.innerHTML = '<option value="">Gagal memuat siswa</option>';
  }

  generateBtn.addEventListener("click", async () => {
    const studentId = studentSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!studentId || !startDate || !endDate) {
      Swal.fire("Data Tidak Lengkap", "Harap pilih siswa dan tentukan rentang tanggal!", "error");
      return;
    }

    Swal.fire({
      title: "Mempersiapkan Laporan...",
      text: "Mengambil data dan membuat grafik. Harap tunggu.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      console.log(`[DEBUG] Memanggil fetchEmotionFrequencyTrend untuk siswa ID: ${studentId}`);
      const trendData = await fetchEmotionFrequencyTrend(startDate, endDate, studentId);

      console.log("[DEBUG] Hasil dari fetchEmotionFrequencyTrend:", trendData);

      let chartImageBase64 = null;

      if (trendData && trendData.chartJsFormat && trendData.chartJsFormat.datasets && trendData.chartJsFormat.datasets.length > 0) {
        console.log("[DEBUG] Data chart valid, siap menggambar grafik untuk ekspor PDF.");

        const optionsForExport = {
          animation: false,
          plugins: {
            title: {
              display: true,
              text: "Grafik Tren Frekuensi Emosi",
              font: { size: 14, weight: "bold" },
              padding: { top: 10, bottom: 10 },
            },
            legend: {
              labels: { font: { size: 9 }, padding: 8 },
              position: "top",
              usePointStyle: true,
            },
            tooltip: {
              enabled: false,
            },
          },
          scales: {
            y: {
              ticks: { font: { size: 9 } },
              grid: { color: "#E5E7EB", drawBorder: false },
              beginAtZero: true,
            },
            x: {
              ticks: { font: { size: 9 } },
              grid: { color: "#E5E7EB", drawBorder: false },
            },
          },
          layout: {
            padding: { top: 5, right: 5, bottom: 5, left: 5 },
          },

          elements: {
            line: {
              tension: 0.4,
              borderWidth: 2,
            },
            point: {
              radius: 3,
              hoverRadius: 5,
              borderWidth: 1,
            },
          },
        };

        renderFrequencyTrendLineChart(hiddenCanvas.id, trendData.chartJsFormat, null, optionsForExport);

        await new Promise((resolve) => setTimeout(resolve, 100));

        chartImageBase64 = hiddenCanvas.toDataURL("image/png");

        console.log("[DEBUG] Hasil Base64 (contoh 100 karakter pertama):", chartImageBase64 ? chartImageBase64.substring(0, 100) + "..." : "NULL");
      } else {
        console.warn("[DEBUG] Tidak ada data chart yang valid untuk digambar. Grafik akan dikirim sebagai null.");
      }

      const reportPayload = {
        student_id: studentId,
        start_date: startDate,
        end_date: endDate,
        chart_image_base64: chartImageBase64,
      };
      console.log("[DEBUG] Payload final yang akan dikirim ke createReport:", reportPayload);

      const result = await createReport(reportPayload.student_id, reportPayload.start_date, reportPayload.end_date, reportPayload.chart_image_base64);

      Swal.fire("Berhasil!", result.message, "success");

      studentSelect.value = "";
      startDateInput.value = "";
      endDateInput.value = "";
    } catch (error) {
      console.error("[DEBUG] Terjadi error di dalam blok try...catch:", error);
      Swal.fire("Gagal", error.message || "Terjadi kesalahan saat membuat laporan.", "error");
    }
  });
}

async function handleCreateUserSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const newUserData = {
    name: form.querySelector("#newUserName").value,
    email: form.querySelector("#newUserEmail").value,
    password: form.querySelector("#newUserPassword").value,
    role: form.querySelector("#newUserRole").value,
  };

  try {
    const result = await createUserByAdmin(newUserData);
    Toastify({
      text: `Sukses! Pengguna "${result.user.name}" berhasil dibuat.`,
      duration: 4000,
      gravity: "top",
      position: "center",
      style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
    }).showToast();
    form.reset();
    loadUserList();
  } catch (error) {
    Toastify({
      text: `Error: ${error.message}`,
      duration: 5000,
      gravity: "top",
      position: "center",
      close: true,
      style: { background: "linear-gradient(to right, #e02828, #ff8c00)" },
    }).showToast();
  }
}

async function loadOverviewData() {
  const todayDominantEmotionTextEl = document.getElementById("todayDominantEmotionText");
  const todayLastUpdatedEl = document.getElementById("todayLastUpdated");
  const weeklyAverageMoodTextEl = document.getElementById("weeklyAverageMoodText");
  const weeklyMoodDescriptionEl = document.getElementById("weeklyMoodDescription");
  const totalJournalEntriesEl = document.getElementById("totalJournalEntries");

  if (!todayDominantEmotionTextEl) {
    console.log("Bukan di dashboard murid, skip memuat data overview.");
    return;
  }

  const todayStr = getFormattedDate(new Date());

  todayDominantEmotionTextEl.innerHTML = "Memuat...";
  try {
    const dailyFrequencyData = await fetchEmotionFrequencyTrend(todayStr, todayStr);
    let dominantToday = "Tidak Ada Deteksi";
    let maxFreq = 0;
    if (dailyFrequencyData?.pivotData?.length > 0) {
      const todayData = dailyFrequencyData.pivotData[0];
      for (const emotion in todayData) {
        if (emotion !== "date" && todayData[emotion] > maxFreq) {
          maxFreq = todayData[emotion];
          dominantToday = emotion;
        }
      }
    }
    dominantToday = maxFreq > 0 ? dominantToday : "Tidak Ada Deteksi";
    const emoji = emotionToEmojiMap[dominantToday.toLowerCase()] || emotionToEmojiMap.default;
    todayDominantEmotionTextEl.innerHTML = `${capitalizeFirstLetter(dominantToday)} <span class="text-3xl">${emoji}</span>`;
    if (todayLastUpdatedEl) todayLastUpdatedEl.textContent = `Hari ini, ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
  } catch (error) {
    console.error("Error fetching today's dominant emotion:", error);
    if (todayDominantEmotionTextEl) todayDominantEmotionTextEl.textContent = "Error";
    if (todayLastUpdatedEl) todayLastUpdatedEl.textContent = "Gagal memuat";
  }

  weeklyAverageMoodTextEl.innerHTML = "Memuat...";
  try {
    const weeklySummary = await fetchEmotionSummaryForChart("weekly", {});
    let moodText = "Data Tidak Tersedia";
    let moodDesc = "Belum ada data minggu ini.";
    if (weeklySummary?.summary_emotion && !["tidak ada data", "tidak ada data skor"].includes(weeklySummary.summary_emotion.toLowerCase())) {
      moodText = capitalizeFirstLetter(weeklySummary.summary_emotion);
      moodDesc = `Minggu: ${new Date(weeklySummary.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${new Date(weeklySummary.end_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }
    const emoji = emotionToEmojiMap[moodText.toLowerCase()] || emotionToEmojiMap.default;
    weeklyAverageMoodTextEl.innerHTML = `${moodText} <span class="text-3xl">${emoji}</span>`;
    if (weeklyMoodDescriptionEl) weeklyMoodDescriptionEl.textContent = moodDesc;
  } catch (error) {
    console.error("Error fetching weekly average mood for overview:", error);
    if (weeklyAverageMoodTextEl) weeklyAverageMoodTextEl.textContent = "Error";
    if (weeklyMoodDescriptionEl) weeklyMoodDescriptionEl.textContent = "Gagal memuat";
  }

  if (totalJournalEntriesEl) {
    totalJournalEntriesEl.textContent = "N/A";
  }
}

async function loadAnalysisCharts() {
  const weeklyCanvasId = "dashboardWeeklyTrendChart";
  const distributionCanvasId = "dashboardEmotionDistributionChart";

  if (!document.getElementById(weeklyCanvasId)) {
    console.log("Bukan di dashboard murid, skip memuat chart.");
    return;
  }

  const today = new Date();
  const endDate = getFormattedDate(today);
  const startDateSevenDaysAgo = getFormattedDate(new Date(new Date().setDate(today.getDate() - 6)));

  drawTextOnCanvas(weeklyCanvasId, "Memuat tren emosi mingguan...");
  drawTextOnCanvas(distributionCanvasId, "Memuat distribusi emosi...");

  try {
    const trendData = await fetchEmotionFrequencyTrend(startDateSevenDaysAgo, endDate);

    if (trendData?.chartJsFormat?.labels?.length > 0) {
      analysisWeeklyTrendChartInstance = renderFrequencyTrendLineChart(weeklyCanvasId, trendData.chartJsFormat, analysisWeeklyTrendChartInstance);

      const emotionTotals = {};
      if (trendData.chartJsFormat.datasets?.length > 0) {
        trendData.chartJsFormat.datasets.forEach((dataset) => {
          emotionTotals[dataset.label.toLowerCase()] = dataset.data.reduce((sum, current) => sum + current, 0);
        });

        const filteredEmotionTotals = Object.fromEntries(Object.entries(emotionTotals).filter(([_, value]) => value > 0));

        if (Object.keys(filteredEmotionTotals).length > 0) {
          analysisEmotionDistributionChartInstance = renderEmotionDistributionDoughnutChart(distributionCanvasId, filteredEmotionTotals, analysisEmotionDistributionChartInstance);
        } else {
          drawTextOnCanvas(distributionCanvasId, "Tidak ada data untuk distribusi emosi.");
        }
      } else {
        drawTextOnCanvas(distributionCanvasId, "Tidak ada data yang cukup untuk chart distribusi.");
      }
    } else {
      drawTextOnCanvas(weeklyCanvasId, "Tidak ada data tren emosi untuk 7 hari terakhir.");
      drawTextOnCanvas(distributionCanvasId, "Tidak ada data distribusi emosi.");
    }
  } catch (error) {
    console.error("Gagal memuat data untuk chart analisis:", error);
    drawTextOnCanvas(weeklyCanvasId, `Gagal memuat tren`, "#ef4444");
    drawTextOnCanvas(distributionCanvasId, `Gagal memuat distribusi`, "#ef4444");
  }
}

async function loadUserList() {
  const tableBody = document.getElementById("user-list-body");
  if (!tableBody) return;

  tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Memuat data pengguna...</td></tr>';

  try {
    const users = await getAllUsersByAdmin();
    tableBody.innerHTML = "";

    if (users.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Belum ada pengguna yang terdaftar.</td></tr>';
      return;
    }

    users.forEach((user, index) => {
      const registrationDate = new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const row = `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-gray-700">${index + 1}</td>
          <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${user.name}</td>
          <td class="px-6 py-4 whitespace-nowrap text-gray-700">${user.email}</td>
          <td class="px-6 py-4 whitespace-nowrap text-gray-700">${user.role}</td>
          <td class="px-6 py-4 whitespace-nowrap text-gray-700">${registrationDate}</td>
        </tr>
      `;

      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error fetching user list:", error);

    tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Gagal memuat data pengguna.</td></tr>';
  }
}

/**
 * Mempersiapkan semua logika untuk dashboard murid,
 * khususnya untuk menampilkan dan mengunduh riwayat laporan.
 */
async function setupStudentDashboard() {
  const tableBody = document.getElementById("student-reports-tbody");

  if (!tableBody) {
    return;
  }

  try {
    const response = await listMyReports();
    const reports = response.data;

    tableBody.innerHTML = "";

    if (!reports || reports.length === 0) {
      const emptyRow = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">Anda belum memiliki riwayat laporan.</td></tr>`;
      tableBody.innerHTML = emptyRow;
      return;
    }

    reports.forEach((report) => {
      const reportDate = new Date(report.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const periodStart = new Date(report.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const periodEnd = new Date(report.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50";
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${periodStart} - ${periodEnd}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${report.teacher.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${reportDate}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="download-btn bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold hover:bg-green-200 transition duration-200 text-xs" data-report-id="${report.id}">
                        Unduh PDF
                    </button>
                </td>
            `;
      tableBody.appendChild(row);
    });

    tableBody.addEventListener("click", async (event) => {
      if (event.target && event.target.classList.contains("download-btn")) {
        const reportId = event.target.getAttribute("data-report-id");
        const originalButtonText = event.target.textContent;

        event.target.textContent = "Mengunduh...";
        event.target.disabled = true;

        try {
          await downloadReport(reportId);
        } catch (error) {
          console.error("Download failed:", error);
          Swal.fire("Gagal Mengunduh", error.message || "Terjadi kesalahan saat mencoba mengunduh file.", "error");
        } finally {
          event.target.textContent = originalButtonText;
          event.target.disabled = false;
        }
      }
    });
  } catch (error) {
    console.error("Gagal memuat riwayat laporan:", error);

    const errorRow = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-500">Gagal memuat riwayat laporan. Silakan refresh halaman.</td></tr>`;
    tableBody.innerHTML = errorRow;
  }
}
