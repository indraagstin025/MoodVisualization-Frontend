const weeklyData = {
  labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
  datasets: [
    {
      label: "Rata-rata Emosi Mingguan (Skala 1-5)",
      data: [3.5, 4.2, 3.8, 4.5],
      backgroundColor: "rgba(52, 211, 153, 0.6)",
      borderColor: "rgba(16, 185, 129, 1)",
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    },
  ],
};

const monthlyData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "Mei"],
  datasets: [
    {
      label: "Rata-rata Emosi Bulanan (Skala 1-5)",
      data: [3.0, 3.2, 3.5, 3.8, 4.1],
      backgroundColor: "rgba(59, 130, 246, 0.6)",
      borderColor: "rgba(37, 99, 235, 1)",
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    },
  ],
};

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
        color: "#4B5563",
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
      max: 5,
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

const ctxWeekly = document.getElementById("weeklyEmotionChart").getContext("2d");
new Chart(ctxWeekly, {
  type: "line",
  data: weeklyData,
  options: commonChartOptions,
});

const ctxMonthly = document.getElementById("monthlyEmotionChart").getContext("2d");
new Chart(ctxMonthly, {
  type: "line",
  data: monthlyData,
  options: commonChartOptions,
});
