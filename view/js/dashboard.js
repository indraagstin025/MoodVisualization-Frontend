import { logoutUser, getLoggedInUser } from "./Services/AuthServices.js";
import { fetchEmotionFrequencyTrend, fetchEmotionSummaryForChart } from "./Services/EmotionDetectionServices.js";
import { CHART_COLORS, BORDER_COLORS, JWT_TOKEN_KEY } from "./constants.js";

let overviewWeeklyAverageChartInstance = null;
let analysisWeeklyTrendChartInstance = null;
let analysisEmotionDistributionChartInstance = null;

function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function capitalizeFirstLetter(string) {
  if (!string || typeof string !== "string") return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const emotionToEmojiMap = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😮",
  fearful: "😨",
  disgusted: "🤢",
  neutral: "😐",
  "tidak ada data": "❓",
  "tidak ada data skor": "❓",
  default: "🤔",
};

function drawTextOnCanvas(canvasId, message, color = "#6b7280", fontSize = "16px") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`drawTextOnCanvas: Canvas element with id '${canvasId}' not found.`);
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.warn(`drawTextOnCanvas: Could not get 2D context for canvas '${canvasId}'.`);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize} Inter, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = message.split("\n");
  const lineHeight = parseInt(fontSize, 10) * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  let startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

  lines.forEach((line) => {
    ctx.fillText(line, canvas.width / 2, startY);
    startY += lineHeight;
  });
}

function renderAverageScoreBarChart(canvasId, averageScoresData, chartTitle, existingChartInstance) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas element with id '${canvasId}' not found for AverageScoreBarChart.`);
    return null;
  }
  const ctx = canvas.getContext("2d");

  const emotionOrder = ["happy", "sad", "angry", "fearful", "surprised", "disgusted", "neutral"];
  const labels = emotionOrder.map((e) => capitalizeFirstLetter(e));
  const dataPoints = emotionOrder.map((e) => (averageScoresData && averageScoresData[e.toLowerCase()] !== undefined ? averageScoresData[e.toLowerCase()] : 0));
  const backgroundColors = emotionOrder.map((e) => (CHART_COLORS && CHART_COLORS[e.toLowerCase()] ? CHART_COLORS[e.toLowerCase()] : "rgba(200,200,200,0.7)"));

  const chartData = { labels, datasets: [{ label: "Rata-rata Skor", data: dataPoints, backgroundColor: backgroundColors, borderWidth: 1 }] };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    scales: { x: { beginAtZero: true, max: 1, title: { display: true, text: "Rata-rata Skor (0-1)" }, ticks: { callback: (v) => (v * 100).toFixed(0) + "%" } }, y: { title: { display: false } } },
    plugins: { legend: { display: false }, title: { display: true, text: chartTitle, font: { size: 14 } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${(c.parsed.x * 100).toFixed(1)}%` } } },
  };

  if (existingChartInstance && existingChartInstance.canvas === canvas) {
    existingChartInstance.data = chartData;
    existingChartInstance.options = chartOptions;
    existingChartInstance.update();
    return existingChartInstance;
  } else {
    const chartOnCanvas = Chart.getChart(canvas);
    if (chartOnCanvas) chartOnCanvas.destroy();
    return new Chart(ctx, { type: "bar", data: chartData, options: chartOptions });
  }
}

function renderFrequencyTrendLineChart(canvasId, apiChartJsData, existingChartInstance) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas element with id '${canvasId}' not found for FrequencyTrendLineChart.`);
    return null;
  }
  const ctx = canvas.getContext("2d");

  const datasets = apiChartJsData.datasets.map((dataset) => ({
    ...dataset,
    fill: false,
    borderColor: (CHART_COLORS && CHART_COLORS[dataset.label.toLowerCase()]) || (BORDER_COLORS && BORDER_COLORS[dataset.label.toLowerCase()]) || "#4A5568",
    backgroundColor: (CHART_COLORS && CHART_COLORS[dataset.label.toLowerCase()]) || (BORDER_COLORS && BORDER_COLORS[dataset.label.toLowerCase()]) || "#4A5568",
    tension: 0.1,
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
  }));

  const chartData = { labels: apiChartJsData.labels, datasets };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, title: { display: true, text: "Frekuensi" }, ticks: { stepSize: 1 } }, x: { title: { display: true, text: "Tanggal (7 Hari Terakhir)" } } },
    plugins: { legend: { position: "bottom" }, tooltip: { mode: "index", intersect: false } },
  };

  if (existingChartInstance && existingChartInstance.canvas === canvas) {
    existingChartInstance.data = chartData;
    existingChartInstance.options = chartOptions;
    existingChartInstance.update();
    return existingChartInstance;
  } else {
    const chartOnCanvas = Chart.getChart(canvas);
    if (chartOnCanvas) chartOnCanvas.destroy();
    return new Chart(ctx, { type: "line", data: chartData, options: chartOptions });
  }
}

function renderEmotionDistributionDoughnutChart(canvasId, aggregatedData, existingChartInstance) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas element with id '${canvasId}' not found for EmotionDistributionDoughnutChart.`);
    return null;
  }
  const ctx = canvas.getContext("2d");

  const labels = Object.keys(aggregatedData).map((key) => capitalizeFirstLetter(key));
  const dataValues = Object.values(aggregatedData);
  const backgroundColors = Object.keys(aggregatedData).map((key) => (CHART_COLORS && CHART_COLORS[key.toLowerCase()] ? CHART_COLORS[key.toLowerCase()] : "#CBD5E0"));

  const chartData = { labels, datasets: [{ label: "Distribusi Emosi", data: dataValues, backgroundColor: backgroundColors, hoverOffset: 8, borderColor: "#fff", borderWidth: 2 }] };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right" },
      tooltip: {
        callbacks: {
          label: (c) => {
            let label = c.label || "";
            if (label) label += ": ";
            if (c.parsed !== null) {
              const total = c.dataset.data.reduce((a, v) => a + v, 0);
              const p = total > 0 ? ((c.parsed / total) * 100).toFixed(1) : 0;
              label += `${c.raw} (${p}%)`;
            }
            return label;
          },
        },
      },
    },
  };

  if (existingChartInstance && existingChartInstance.canvas === canvas) {
    existingChartInstance.data = chartData;
    existingChartInstance.options = chartOptions;
    existingChartInstance.update();
    return existingChartInstance;
  } else {
    const chartOnCanvas = Chart.getChart(canvas);
    if (chartOnCanvas) chartOnCanvas.destroy();
    return new Chart(ctx, { type: "doughnut", data: chartData, options: chartOptions });
  }
}

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
      if (dailyFrequencyData && dailyFrequencyData.pivotData && dailyFrequencyData.pivotData.length > 0) {
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

      if (weeklySummary && weeklySummary.summary_emotion && !["tidak ada data", "tidak ada data skor"].includes(weeklySummary.summary_emotion.toLowerCase())) {
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

    if (trendData && trendData.chartJsFormat && trendData.chartJsFormat.labels && trendData.chartJsFormat.labels.length > 0) {
      analysisWeeklyTrendChartInstance = renderFrequencyTrendLineChart(weeklyCanvasId, trendData.chartJsFormat, analysisWeeklyTrendChartInstance);

      const emotionTotals = {};
      let hasAnyDataForDistribution = false;
      if (trendData.chartJsFormat.datasets && trendData.chartJsFormat.datasets.length > 0) {
        trendData.chartJsFormat.datasets.forEach((dataset) => {
          emotionTotals[dataset.label.toLowerCase()] = 0;
        });
        trendData.chartJsFormat.datasets.forEach((dataset) => {
          const totalForEmotion = dataset.data.reduce((sum, current) => sum + current, 0);
          emotionTotals[dataset.label.toLowerCase()] = totalForEmotion;
          if (totalForEmotion > 0) hasAnyDataForDistribution = true;
        });

        const filteredEmotionTotals = {};
        for (const emotion in emotionTotals) {
          if (emotionTotals[emotion] > 0) {
            filteredEmotionTotals[emotion] = emotionTotals[emotion];
          }
        }

        if (hasAnyDataForDistribution) {
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
    drawTextOnCanvas(weeklyCanvasId, `Gagal memuat tren: ${error.message.substring(0, 100)}`, "#ef4444");
    drawTextOnCanvas(distributionCanvasId, `Gagal memuat distribusi: ${error.message.substring(0, 100)}`, "#ef4444");
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  console.log("Dashboard script dimuat.");

  const welcomeHeading = document.getElementById("mainWelcomeHeading") || document.querySelector("h1");
  if (welcomeHeading) {
    try {
      const apiResponse = await getLoggedInUser();
      console.log("Data pengguna diterima dari API:", apiResponse);

      if (apiResponse && apiResponse.user && apiResponse.user.username) {
        const username = apiResponse.user.username;
        console.log("Username ditemukan:", username);

        welcomeHeading.textContent = `Halo, ${username}! Selamat Datang di Dashboard Anda.`;
      } else {
        console.log("Username tidak ditemukan di data pengguna (apiResponse.user.username), menggunakan default.");
        welcomeHeading.textContent = `Halo, Pengguna MoodVis! Selamat Datang di Dashboard Anda.`;
      }
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
      if (welcomeHeading) {
        welcomeHeading.textContent = `Halo, Pengguna MoodVis! Selamat Datang di Dashboard Anda.`;
      }

      const errorMessage = String(error.message || error).toLowerCase();
      if (errorMessage.includes("401") || errorMessage.includes("unauthorized") || errorMessage.includes("tidak ada token") || errorMessage.includes("token jwt tidak ditemukan")) {
        Swal.fire({
          title: "Sesi Berakhir",
          text: "Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.",
          icon: "warning",
          confirmButtonText: "Login Ulang",
          allowOutsideClick: false,
          willClose: () => {
            logoutUser();
          },
        });
      }
    }
  } else {
    console.warn("Elemen untuk welcome heading (misalnya, ID 'mainWelcomeHeading') tidak ditemukan.");
  }

  loadOverviewData();
  loadAnalysisCharts();

  const logoutButton = document.getElementById("logoutButton");
  const logoutButtonMobile = document.getElementById("logoutButtonMobile");
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileMenuEl = document.getElementById("mobileMenu");

  function showLogoutConfirmation() {
    Swal.fire({
      title: "Apakah Anda yakin ingin logout?",
      text: "Anda akan keluar dari sesi ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#EF4444",
      confirmButtonText: "Ya, Logout!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        logoutUser();
      }
    });
  }

  if (logoutButton) logoutButton.addEventListener("click", showLogoutConfirmation);
  if (logoutButtonMobile) {
    logoutButtonMobile.addEventListener("click", function () {
      if (mobileMenuEl) mobileMenuEl.classList.add("hidden");
      showLogoutConfirmation();
    });
  }
  if (mobileMenuButton && mobileMenuEl) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenuEl.classList.toggle("hidden");
    });
  }
  document.querySelectorAll("nav a, #mobileMenu a").forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href && href.startsWith("#") && this.hostname === window.location.hostname && this.pathname === window.location.pathname) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) {
          window.scrollTo({ top: targetElement.offsetTop - 70, behavior: "smooth" });
          if (mobileMenuEl && !mobileMenuEl.classList.contains("hidden")) {
            mobileMenuEl.classList.add("hidden");
          }
        }
      } else if (href && !href.startsWith("#")) {
        if (mobileMenuEl && !mobileMenuEl.classList.contains("hidden")) {
          mobileMenuEl.classList.add("hidden");
        }
      }
    });
  });
});
