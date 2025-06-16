import { fetchEmotionFrequencyTrend, fetchEmotionSummaryForChart } from "../../Services/EmotionDetectionServices.js";
import { listMyReports, downloadReport } from "../../Services/ReportServices.js";
import { getFormattedDate, capitalizeFirstLetter, emotionToEmojiMap, drawTextOnCanvas } from "../../utils/utils.js";
import { renderFrequencyTrendLineChart, renderEmotionDistributionDoughnutChart } from "../../utils/chart_renderer.js";

let analysisWeeklyTrendChartInstance = null;
let analysisEmotionDistributionChartInstance = null;

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

  if (analysisWeeklyTrendChartInstance) analysisWeeklyTrendChartInstance.destroy();
  if (analysisEmotionDistributionChartInstance) analysisEmotionDistributionChartInstance.destroy();

  const today = new Date();
  const endDate = getFormattedDate(today);
  const startDateSevenDaysAgo = getFormattedDate(new Date(new Date().setDate(today.getDate() - 6)));

  drawTextOnCanvas(weeklyCanvasId, "Memuat tren emosi mingguan...");
  drawTextOnCanvas(distributionCanvasId, "Memuat distribusi emosi...");

  try {
    const trendData = await fetchEmotionFrequencyTrend(startDateSevenDaysAgo, endDate);

    if (trendData?.chartJsFormat?.labels?.length > 0) {
      analysisWeeklyTrendChartInstance = renderFrequencyTrendLineChart(weeklyCanvasId, trendData.chartJsFormat);

      const emotionTotals = {};
      trendData.chartJsFormat.datasets.forEach((dataset) => {
        emotionTotals[dataset.label.toLowerCase()] = dataset.data.reduce((sum, current) => sum + current, 0);
      });

      const filteredEmotionTotals = Object.fromEntries(Object.entries(emotionTotals).filter(([_, value]) => value > 0));

      if (Object.keys(filteredEmotionTotals).length > 0) {
        analysisEmotionDistributionChartInstance = renderEmotionDistributionDoughnutChart(distributionCanvasId, filteredEmotionTotals);
      } else {
        drawTextOnCanvas(distributionCanvasId, "Tidak ada data untuk distribusi emosi.");
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


/**
 * Memeriksa apakah murid sudah melengkapi profilnya (memilih kelas).
 * Mengatur tampilan notifikasi dan bagian yang relevan sesuai kondisi profil.
 */
function checkUserProfileCompletion() {
  // Sebelumnya saya menyarankan "main", tapi setelah melihat HTML Anda,
  // target yang lebih tepat adalah div container utama dashboard.
  const dashboardContainer = document.getElementById("student-dashboard-content");
  const reportsSection = document.getElementById("student-reports-section");

  if (!dashboardContainer || !reportsSection) return;

  try {
    const userData = JSON.parse(localStorage.getItem("user"));

    if (userData && userData.class_id === null) {
      // --- KONDISI 1: MURID BELUM MEMILIH KELAS ---

      // 1. Pastikan bagian laporan tetap tersembunyi
      reportsSection.classList.add("hidden");

      // 2. Buat dan tampilkan notifikasi untuk melengkapi profil
      const profileAlertHTML = `
        <div id="profile-completion-alert" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
          <div class="flex">
            <div class="py-1"><svg class="fill-current h-6 w-6 text-yellow-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg></div>
            <div>
              <p class="font-bold">Lengkapi Profil Anda</p>
              <p class="text-sm">Anda belum terdaftar di kelas manapun. Silakan pilih kelas Anda di halaman profil untuk melihat laporan dari guru.</p>
              <a href="profile.html" class="mt-2 inline-block bg-yellow-500 text-white font-bold py-1 px-3 rounded text-xs hover:bg-yellow-600">Lengkapi Profil Sekarang</a>
            </div>
          </div>
        </div>
      `;
      // Masukkan notifikasi di bagian atas konten dashboard
      dashboardContainer.insertAdjacentHTML("afterbegin", profileAlertHTML);

    } else if (userData && userData.class_id !== null) {
      // --- KONDISI 2: MURID SUDAH MEMILIKI KELAS ---

      // Tampilkan kembali bagian riwayat laporan yang tadi disembunyikan
      reportsSection.classList.remove("hidden");
    }
  } catch (error) {
    console.error("Gagal memeriksa kelengkapan profil pengguna:", error);
  }
}

// Pastikan fungsi init() Anda masih memanggil fungsi ini
export function init() {
  console.log("Inisialisasi modul dashboard MURID.");
  checkUserProfileCompletion(); // Panggilan ke fungsi yang sudah diupdate
  loadOverviewData();
  loadAnalysisCharts();
  setupStudentDashboard();
}