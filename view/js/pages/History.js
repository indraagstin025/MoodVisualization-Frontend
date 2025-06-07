import { fetchEmotionHistory, fetchEmotionSummaryForChart, deleteEmotionRecordById } from "../Services/EmotionDetectionServices.js";
import { CHART_COLORS, BORDER_COLORS, JWT_TOKEN_KEY } from "../utils/constants.js";

console.log("Imported CHART_COLORS:", CHART_COLORS);
console.log("Imported BORDER_COLORS:", BORDER_COLORS);

document.addEventListener("DOMContentLoaded", async () => {
  const logTableBody = document.getElementById("logDetectionTableBody");
  const weeklyChartCanvas = document.getElementById("weeklyEmotionChart")?.getContext("2d");
  const monthlyChartCanvas = document.getElementById("monthlyEmotionChart")?.getContext("2d");
  const weeklySummaryTextEl = document.getElementById("weeklySummaryText");
  const monthlySummaryTextEl = document.getElementById("monthlySummaryText");
  const paginationControlsEl = document.getElementById("paginationControls");

  const logoutButton = document.getElementById("logoutButton");
  const logoutButtonMobile = document.getElementById("logoutButtonMobile");
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileMenu = document.getElementById("mobileMenu");

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }

  const handleLogout = () => {
    localStorage.removeItem(JWT_TOKEN_KEY);

    window.location.href = "login.html";
  };

  if (logoutButton) logoutButton.addEventListener("click", handleLogout);
  if (logoutButtonMobile) logoutButtonMobile.addEventListener("click", handleLogout);

  let weeklyEmotionChartInstance = null;
  let monthlyEmotionChartInstance = null;
  let currentPage = 1;
  const itemsPerPage = 10;

  function renderLogTable(records = []) {
    if (!logTableBody) {
      console.warn("Elemen tbody untuk log deteksi tidak ditemukan.");
      return;
    }
    logTableBody.innerHTML = "";

    if (records.length === 0) {
      logTableBody.innerHTML = `<tr><td colspan="4" class="py-4 px-6 text-center text-gray-500">Tidak ada riwayat deteksi.</td></tr>`;
      return;
    }

    records.forEach((record) => {
      const date = new Date(record.detection_timestamp);
      const formattedDate = date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
      const formattedTime = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      const emotionToDisplay = record.dominant_emotion ? record.dominant_emotion.charAt(0).toUpperCase() + record.dominant_emotion.slice(1) : "N/A";

      const row = `
                <tr class="hover:bg-green-50 transition duration-150">
                    <td class="py-4 px-6 whitespace-nowrap">${formattedDate}</td>
                    <td class="py-4 px-6 whitespace-nowrap">${formattedTime}</td>
                    <td class="py-4 px-6 whitespace-nowrap font-medium capitalize">${emotionToDisplay}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center">
                        <button data-id="${record.id}" class="delete-record-btn text-red-500 hover:text-red-700 font-semibold focus:outline-none">Hapus</button>
                    </td>
                </tr>
            `;
      logTableBody.insertAdjacentHTML("beforeend", row);
    });

    document.querySelectorAll(".delete-record-btn").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const recordId = event.currentTarget.dataset.id;

        Swal.fire({
          title: "Apakah Anda yakin?",

          text: "Anda akan menghapus catatan ini. Tindakan ini tidak dapat diurungkan!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Ya, hapus!",
          cancelButtonText: "Batal",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await deleteEmotionRecordById(recordId);

              Swal.fire("Dihapus!", "Catatan berhasil dihapus.", "success");

              loadLogData(currentPage);
              loadChartData();
            } catch (error) {
              Swal.fire(
                "Gagal!",

                `Gagal menghapus catatan: ${error.message}`,
                "error"
              );
            }
          }
        });
      });
    });
  }

  function createOrUpdateAverageScoreChart(ctx, chartInstance, periodLabel, averageScoresData) {
    if (!ctx) {
      console.error(`Canvas context tidak ditemukan untuk chart: ${periodLabel}`);
      return null;
    }
    const canvas = ctx.canvas;

    const emotionOrder = ["happy", "sad", "angry", "fearful", "surprised", "disgusted", "neutral"];
    const labels = [];
    const dataPoints = [];
    const backgroundColors = [];
    const borderColors = [];

    const safeChartColors = CHART_COLORS || {};
    const safeBorderColors = BORDER_COLORS || {};

    emotionOrder.forEach((emotionKey) => {
      const currentAverageScores = averageScoresData || {};
      const score = currentAverageScores[emotionKey.toLowerCase()];

      labels.push(emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1));
      dataPoints.push(score !== undefined && score !== null ? score : 0);

      backgroundColors.push(safeChartColors[emotionKey.toLowerCase()] || "rgba(200, 200, 200, 0.8)");
      borderColors.push(safeBorderColors[emotionKey.toLowerCase()] || "rgba(150, 150, 150, 1)");
    });

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: `Rata-rata Skor Emosi (${periodLabel})`,
          data: dataPoints,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          title: { display: true, text: "Rata-rata Skor (0-1)" },
          ticks: {
            callback: function (value) {
              return (value * 100).toFixed(0) + "%";
            },
          },
        },
        x: { title: { display: true, text: "Emosi" } },
      },
      plugins: {
        legend: { display: true, position: "top" },
        title: { display: true, text: `Rata-rata Emosi ${periodLabel}`, font: { size: 16 } },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "Skor";
              if (label.includes(`(${periodLabel})`)) {
                label = "Rata-rata Skor";
              }
              if (label) label += ": ";
              if (context.parsed.y !== null) {
                label += (context.parsed.y * 100).toFixed(2) + "%";
              }
              return label;
            },
          },
        },
      },
    };

    if (chartInstance && chartInstance.canvas === canvas) {
      chartInstance.data = chartData;
      chartInstance.options = chartOptions;
      chartInstance.update();
      return chartInstance;
    } else {
      const existingChartOnCanvas = Chart.getChart(canvas);
      if (existingChartOnCanvas) {
        existingChartOnCanvas.destroy();
      }
      return new Chart(ctx, {
        type: "bar",
        data: chartData,
        options: chartOptions,
      });
    }
  }

  function renderPaginationControls(paginationData) {
    if (!paginationControlsEl || !paginationData) return;
    paginationControlsEl.innerHTML = "";

    const prevButton = document.createElement("button");
    prevButton.innerHTML = "&laquo; Sebelumnya";
    prevButton.className = "px-4 py-2 mx-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50";
    prevButton.disabled = !paginationData.prev_page_url;
    prevButton.addEventListener("click", () => {
      if (paginationData.prev_page_url) {
        currentPage--;
        loadLogData(currentPage);
      }
    });
    paginationControlsEl.appendChild(prevButton);

    const pageInfo = document.createElement("span");
    pageInfo.className = "px-4 py-2 mx-1 text-gray-700";
    pageInfo.textContent = `Halaman ${paginationData.current_page} dari ${paginationData.last_page}`;
    paginationControlsEl.appendChild(pageInfo);

    const nextButton = document.createElement("button");
    nextButton.innerHTML = "Berikutnya &raquo;";
    nextButton.className = "px-4 py-2 mx-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50";
    nextButton.disabled = !paginationData.next_page_url;
    nextButton.addEventListener("click", () => {
      if (paginationData.next_page_url) {
        currentPage++;
        loadLogData(currentPage);
      }
    });
    paginationControlsEl.appendChild(nextButton);
  }

  async function loadLogData(page = 1) {
    if (!logTableBody) return;
    logTableBody.innerHTML = `<tr><td colspan="4" class="py-4 px-6 text-center text-gray-500">Memuat riwayat...</td></tr>`;
    try {
      const paginatedResult = await fetchEmotionHistory(page, itemsPerPage);
      renderLogTable(paginatedResult.data);
      renderPaginationControls(paginatedResult);
      currentPage = paginatedResult.current_page;
    } catch (error) {
      console.error("Gagal memuat log deteksi:", error);
      if (logTableBody) logTableBody.innerHTML = `<tr><td colspan="4" class="py-4 px-6 text-center text-red-500">Gagal memuat riwayat: ${error.message}</td></tr>`;
    }
  }

  async function loadChartData() {
    const today = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    if (weeklyChartCanvas && weeklySummaryTextEl) {
      weeklySummaryTextEl.textContent = "Memuat data mingguan...";
      try {
        const weeklyData = await fetchEmotionSummaryForChart("weekly", { date: today });
        if (weeklyData.summary_emotion && weeklyData.summary_emotion !== "tidak ada data") {
          weeklySummaryTextEl.textContent = `Minggu ini, Anda cenderung merasa ${weeklyData.summary_emotion.charAt(0).toUpperCase() + weeklyData.summary_emotion.slice(1)}.`;
        } else if (weeklyData.summary_emotion === "tidak ada data") {
          weeklySummaryTextEl.textContent = "Tidak ada data deteksi untuk minggu ini.";
        } else {
          weeklySummaryTextEl.textContent = "Tidak dapat menentukan emosi dominan minggu ini.";
        }
        weeklyEmotionChartInstance = createOrUpdateAverageScoreChart(weeklyChartCanvas, weeklyEmotionChartInstance, "Mingguan", weeklyData.average_scores || {});
      } catch (error) {
        console.error("Gagal memuat data chart mingguan:", error);
        weeklySummaryTextEl.textContent = "Gagal memuat data mingguan.";
      }
    }

    if (monthlyChartCanvas && monthlySummaryTextEl) {
      monthlySummaryTextEl.textContent = "Memuat data bulanan...";
      try {
        const monthlyData = await fetchEmotionSummaryForChart("monthly", { year: currentYear, month: currentMonth });
        if (monthlyData.summary_emotion && monthlyData.summary_emotion !== "tidak ada data") {
          monthlySummaryTextEl.textContent = `Bulan ini, Anda cenderung merasa ${monthlyData.summary_emotion.charAt(0).toUpperCase() + monthlyData.summary_emotion.slice(1)}.`;
        } else if (monthlyData.summary_emotion === "tidak ada data") {
          monthlySummaryTextEl.textContent = "Tidak ada data deteksi untuk bulan ini.";
        } else {
          monthlySummaryTextEl.textContent = "Tidak dapat menentukan emosi dominan bulan ini.";
        }
        monthlyEmotionChartInstance = createOrUpdateAverageScoreChart(monthlyChartCanvas, monthlyEmotionChartInstance, "Bulanan", monthlyData.average_scores || {});
      } catch (error) {
        console.error("Gagal memuat data chart bulanan:", error);
        monthlySummaryTextEl.textContent = "Gagal memuat data bulanan.";
      }
    }
  }

  if (!localStorage.getItem(JWT_TOKEN_KEY)) {
    alert("Anda harus login untuk melihat halaman ini.");
    window.location.href = "login.html";
  } else {
    loadLogData(currentPage);
    loadChartData();
  }
});
