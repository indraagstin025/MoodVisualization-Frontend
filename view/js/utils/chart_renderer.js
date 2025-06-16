import { CHART_COLORS, BORDER_COLORS } from "./constants.js";
import { capitalizeFirstLetter } from "./utils.js";

export function renderAverageScoreBarChart(canvasId, averageScoresData, chartTitle, existingChartInstance) {
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

export function renderFrequencyTrendLineChart(canvasId, apiChartJsData, existingChartInstance, customOptions = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`Canvas dengan ID '${canvasId}' tidak ditemukan.`);
    return null;
  }
  const ctx = canvas.getContext("2d");

  // SOLUSI #1: Definisikan palet warna yang jelas di sini
  const EMOTION_COLOR_MAP = {
    // Label emosi harus sama persis dengan yang dari API (case-insensitive)
    sadness:   { border: 'rgba(25, 118, 210, 1)',   background: 'rgba(25, 118, 210, 0.2)' }, // Biru
    happiness: { border: 'rgba(255, 193, 7, 1)',    background: 'rgba(255, 193, 7, 0.2)'  }, // Kuning
    surprise:  { border: 'rgba(156, 39, 176, 1)',    background: 'rgba(156, 39, 176, 0.2)' }, // Ungu
    anger:     { border: 'rgba(211, 47, 47, 1)',       background: 'rgba(211, 47, 47, 0.2)'  }, // Merah
    fear:      { border: 'rgba(97, 97, 97, 1)',         background: 'rgba(97, 97, 97, 0.2)'   }, // Abu Gelap
    disgust:   { border: 'rgba(76, 175, 80, 1)',      background: 'rgba(76, 175, 80, 0.2)'  }, // Hijau
    neutral:   { border: 'rgba(189, 189, 189, 1)',   background: 'rgba(189, 189, 189, 0.2)' }  // Abu Terang
  };

  const datasets = apiChartJsData.datasets.map((dataset) => {
    const emotionKey = dataset.label.toLowerCase();
    const colors = EMOTION_COLOR_MAP[emotionKey] || { border: '#4A5568', background: 'rgba(74, 85, 104, 0.2)' }; // Fallback color

    return {
      ...dataset,
      // SOLUSI #2: Ubah 'fill' menjadi 'false'
      fill: false, 
      borderColor: colors.border,
      backgroundColor: colors.border, // Untuk titik dan legenda, gunakan warna solid
      tension: 0.1, // Dibuat lebih landai agar tidak terlalu tajam
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: colors.border,
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: colors.border,
      pointHoverBorderColor: "#fff",
    };
  });

  const chartData = { labels: apiChartJsData.labels, datasets };

  // Opsi dasar tetap sama dengan yang Anda miliki, sudah bagus
const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
    x: { grid: { drawOnChartArea: false } },
  },
  plugins: {
    legend: {
      position: "top",
      labels: { usePointStyle: true, boxWidth: 8, padding: 20 },
    },
    // --- Bagian yang Diubah ---
    title: {
      display: true,
      text: "Grafik Tren Frekuensi Emosi",
      font: { size: 16, weight: "600" },
      padding: {
        top: 15, // Memberi jarak di ATAS judul untuk menurunkannya
        bottom: 20, // Memberi jarak di BAWAH judul agar seimbang
      },
    },
    // -------------------------
    tooltip: { mode: "index", intersect: false },
  },
  hover: { mode: "index", intersect: false },
  interaction: { mode: "index", intersect: false },
};
  const finalOptions = { ...baseOptions, ...customOptions };

  // Hancurkan chart lama sebelum membuat yang baru
  const chartOnCanvas = Chart.getChart(canvas);
  if (chartOnCanvas) {
    chartOnCanvas.destroy();
  }

  // Buat chart dengan tipe 'line'
  return new Chart(ctx, { type: "line", data: chartData, options: finalOptions });
}

export function renderEmotionDistributionDoughnutChart(canvasId, aggregatedData, existingChartInstance) {
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

