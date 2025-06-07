import { getLoggedInUser, logoutUser } from "../Services/AuthServices.js";
import { fetchEmotionFrequencyTrend, fetchEmotionSummaryForChart } from "../Services/EmotionDetectionServices.js";
import { getFormattedDate, capitalizeFirstLetter, emotionToEmojiMap, drawTextOnCanvas } from "../utils/utils.js";
import { renderFrequencyTrendLineChart, renderEmotionDistributionDoughnutChart } from "../utils/chart_renderer.js";

let analysisWeeklyTrendChartInstance = null;
let analysisEmotionDistributionChartInstance = null;

async function loadOverviewData() {
  const todayDominantEmotionTextEl = document.getElementById("todayDominantEmotionText");
  const todayLastUpdatedEl = document.getElementById("todayLastUpdated");
  const weeklyAverageMoodTextEl = document.getElementById("weeklyAverageMoodText");
  const weeklyMoodDescriptionEl = document.getElementById("weeklyMoodDescription");
  const todayStr = getFormattedDate(new Date());

  if (todayDominantEmotionTextEl) {
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
  }

  if (weeklyAverageMoodTextEl) {
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
  }

  const totalJournalEntriesEl = document.getElementById("totalJournalEntries");
  if (totalJournalEntriesEl) {
    totalJournalEntriesEl.textContent = "N/A";
  }
}

async function loadAnalysisCharts() {
  const today = new Date();
  const endDate = getFormattedDate(today);
  const startDateSevenDaysAgo = getFormattedDate(new Date(new Date().setDate(today.getDate() - 6)));
  const weeklyCanvasId = "dashboardWeeklyTrendChart";
  const distributionCanvasId = "dashboardEmotionDistributionChart";

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

document.addEventListener("DOMContentLoaded", async function () {
  const dashboardPageFilename = "dashboard.html";

  if (window.location.pathname.includes(dashboardPageFilename)) {
    console.log("Menjalankan skrip khusus untuk halaman dashboard.");

    const welcomeHeading = document.getElementById("mainWelcomeHeading");
    if (welcomeHeading) {
      try {
        const apiResponse = await getLoggedInUser();
        if (apiResponse?.user?.username) {
          welcomeHeading.textContent = `Halo, ${apiResponse.user.username}! Selamat Datang di Dashboard Anda.`;
        } else {
          welcomeHeading.textContent = `Halo, Pengguna MoodVis! Selamat Datang di Dashboard Anda.`;
        }
      } catch (error) {
        console.error("Gagal mengambil data pengguna:", error);
        welcomeHeading.textContent = `Halo, Pengguna MoodVis! Selamat Datang di Dashboard Anda.`;

        const errorMessage = String(error.message || error).toLowerCase();
        if (errorMessage.includes("401") || errorMessage.includes("unauthorized") || errorMessage.includes("token")) {
          Swal.fire({
            title: "Sesi Berakhir",
            text: "Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.",
            icon: "warning",
            confirmButtonText: "Login Ulang",
            allowOutsideClick: false,
          }).then(() => {
            logoutUser();
          });
        }
      }
    }

    loadOverviewData();
    loadAnalysisCharts();
  }
});
