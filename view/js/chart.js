

// Data emosi placeholder (Anda akan mendapatkan ini dari backend)
const weeklyData = {
  labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
  datasets: [
    {
      label: "Rata-rata Emosi Mingguan (Skala 1-5)",
      data: [3.5, 4.2, 3.8, 4.5], // Contoh data: 1=Sedih, 5=Senang
      backgroundColor: "rgba(52, 211, 153, 0.6)", // green-400
      borderColor: "rgba(16, 185, 129, 1)", // green-600
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    },
  ],
};

const monthlyData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "Mei"], // Bulan-bulan
  datasets: [
    {
      label: "Rata-rata Emosi Bulanan (Skala 1-5)",
      data: [3.0, 3.2, 3.5, 3.8, 4.1], // Contoh data
      backgroundColor: "rgba(59, 130, 246, 0.6)", // blue-500
      borderColor: "rgba(37, 99, 235, 1)", // blue-700
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    },
  ],
};

// Konfigurasi Chart.js umum
const commonChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        font: {
          family: "Inter",
          size: 14,
        },
        color: "#4B5563", // gray-700
      },
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          return context.dataset.label + ": " + context.parsed.y.toFixed(2);
        },
      },
      bodyFont: {
        family: "Inter",
      },
      titleFont: {
        family: "Inter",
        weight: "bold",
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 5, // Skala 1-5 (misal: 1=Sangat Negatif, 5=Sangat Positif)
      title: {
        display: true,
        text: "Skala Emosi (1-5)",
        font: {
          family: "Inter",
          weight: "bold",
        },
        color: "#4B5563",
      },
      ticks: {
        font: {
          family: "Inter",
        },
        color: "#6B7280",
      },
    },
    x: {
      title: {
        display: true,
        text: "Periode",
        font: {
          family: "Inter",
          weight: "bold",
        },
        color: "#4B5563",
      },
      ticks: {
        font: {
          family: "Inter",
        },
        color: "#6B7280",
      },
    },
  },
};

// Render Chart Mingguan
const ctxWeekly = document.getElementById("weeklyEmotionChart").getContext("2d");
new Chart(ctxWeekly, {
  type: "line", // Bisa juga 'bar' jika preferensi lain
  data: weeklyData,
  options: commonChartOptions,
});

// Render Chart Bulanan
const ctxMonthly = document.getElementById("monthlyEmotionChart").getContext("2d");
new Chart(ctxMonthly, {
  type: "line", // Bisa juga 'bar' jika preferensi lain
  data: monthlyData,
  options: commonChartOptions,
});



    
