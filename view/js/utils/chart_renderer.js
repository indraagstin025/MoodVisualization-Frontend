// File: js/utils/chart-renderer.js

import { CHART_COLORS, BORDER_COLORS } from "./constants.js"; // Path relatif dari js/utils ke js/
import { capitalizeFirstLetter } from "./utils.js"; // Path relatif di dalam folder yang sama

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

export function renderFrequencyTrendLineChart(canvasId, apiChartJsData, existingChartInstance) {
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
