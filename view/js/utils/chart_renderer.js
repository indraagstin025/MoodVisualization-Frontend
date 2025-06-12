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

export function renderFrequencyTrendLineChart(canvasId, apiChartJsData, existingChartInstance, customOptions = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`Canvas dengan ID '${canvasId}' tidak ditemukan.`);
        return null;
    }
    const ctx = canvas.getContext("2d");

    // === PENYEMPURNAAN VISUAL DATASET ===
    const datasets = apiChartJsData.datasets.map((dataset) => ({
        ...dataset,
        fill: 'origin', // Mengisi area di bawah garis
        borderColor: (BORDER_COLORS && BORDER_COLORS[dataset.label.toLowerCase()]) || "#4A5568", // Menggunakan BORDER_COLORS
        backgroundColor: (CHART_COLORS && CHART_COLORS[dataset.label.toLowerCase()]) || "rgba(74, 85, 104, 0.2)", // Menggunakan CHART_COLORS untuk area fill
        tension: 0.4, // Sedikit lebih melengkung untuk estetika yang lebih halus
        borderWidth: 2, // Garis sedikit lebih tipis untuk ukuran kecil
        pointRadius: 3, // Titik data lebih kecil
        pointHoverRadius: 5, // Titik data lebih kecil saat di-hover
        pointBackgroundColor: (CHART_COLORS && CHART_COLORS[dataset.label.toLowerCase()]) || "#4A5568", // Warna titik data sama dengan garis
        pointBorderColor: '#fff', // Border putih di sekitar titik untuk kontras
        pointBorderWidth: 1, // Ketebalan border titik lebih tipis
    }));

    const chartData = { labels: apiChartJsData.labels, datasets };

    // === PENYEMPURNAAN OPSI CHART ===
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: { 
            y: { 
                beginAtZero: true, 
                ticks: { 
                    stepSize: 1, // Sumbu Y hanya menampilkan angka bulat
                    font: { size: 10 } // Font lebih kecil
                },
                grid: {
                    color: '#E5E7EB', // Garis kisi lebih terang
                    drawBorder: false, // Jangan menggambar border di sekitar area grid
                },
            },
            x: {
                ticks: {
                    font: { size: 10 } // Font lebih kecil
                },
                grid: {
                    color: '#E5E7EB', // Garis kisi lebih terang
                    drawBorder: false,
                },
            }
        },
        plugins: { 
            legend: { 
                position: "top", // Posisi legenda di atas agar lebih rapi
                labels: {
                    font: { size: 10 }, // Font legenda lebih kecil
                    padding: 10, // Beri jarak pada legenda lebih kecil
                    usePointStyle: true, // Menggunakan bentuk titik untuk item legenda
                }
            },
            title: { // Menambahkan bagian title plugin
                display: true,
                text: 'Grafik Tren Frekuensi Emosi',
                font: {
                    size: 14, // Ukuran judul lebih kecil
                    weight: 'bold',
                },
                padding: { top: 10, bottom: 10 },
                color: '#333'
            },
            tooltip: { // Menyesuaikan tooltip untuk ukuran yang lebih kecil
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: {
                    size: 10,
                },
                bodyFont: {
                    size: 9,
                },
                padding: 8,
                cornerRadius: 5,
                displayColors: true,
                boxPadding: 3,
            }
        },
        // Opsi untuk kualitas rendering yang lebih baik
        layout: {
            padding: 5 // Padding keseluruhan lebih kecil
        },
        animation: { // Menambahkan animasi untuk kesan lebih modern
            duration: 1000,
            easing: 'easeInOutQuart',
            mode: 'dataset',
        },
        hover: { // Menambahkan opsi hover yang lebih baik
            mode: 'index',
            intersect: false,
            animationDuration: 400,
        },
    };

    // Gabungkan opsi dasar dengan opsi custom (misal: mematikan animasi untuk ekspor)
    const finalOptions = { ...baseOptions, ...customOptions };

    // Hancurkan chart lama jika ada
    const chartOnCanvas = Chart.getChart(canvas);
    if (chartOnCanvas) {
        chartOnCanvas.destroy();
    }

    // Buat chart baru dengan data dan opsi yang sudah disempurnakan
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
