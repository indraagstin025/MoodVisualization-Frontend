// Frontend/view/js/ui.js
import { CHART_COLORS, BORDER_COLORS } from './constants.js';

let expressionChartInstance = null; // Menyimpan instance Chart

export function initializeExpressionChart(ctx) {
    if (!ctx) {
        console.warn("Canvas context for expression chart not found.");
        return null;
    }
    if (expressionChartInstance) {
        expressionChartInstance.destroy(); // Hancurkan instance lama jika ada
    }

    expressionChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(CHART_COLORS).map((label) => label.charAt(0).toUpperCase() + label.slice(1)),
            datasets: [{
                label: "Probabilitas",
                data: Array(Object.keys(CHART_COLORS).length).fill(0),
                backgroundColor: Object.values(CHART_COLORS),
                borderColor: Object.values(BORDER_COLORS),
                borderWidth: 1,
            }, ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500, easing: "easeOutQuart" },
            scales: {
                y: {
                    beginAtZero: true, max: 1,
                    title: { display: true, text: "Probabilitas" },
                    ticks: { callback: function(value) { return (value * 100).toFixed(0) + "%"; } },
                },
                x: { title: { display: true, text: "Emosi" } },
            },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) {
                let label = context.dataset.label || "";
                if (label) label += ": ";
                if (context.parsed.y !== null) label += (context.parsed.y * 100).toFixed(2) + "%";
                return label;
            } } } },
        },
    });
    return expressionChartInstance;
}

// Menambahkan 'expressionChartCtx' sebagai parameter dan 'lastDetectedTimestamp'
export function updateUI(expressionsData, dominantEmotion, emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, lastDetectedTimestamp) {
    // Update teks emosi dominan
    if (emotionResultEl) {
        emotionResultEl.textContent = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);
    }

    // Update list emosi
    // Halaman monitoring.html Anda tidak memiliki elemen 'expressionList'.
    // Jadi bagian ini tidak akan berpengaruh, tapi tetap aman untuk dipertahankan
    // jika Anda menambahkannya di masa depan atau di halaman lain.
    if (expressionList) {
        expressionList.innerHTML = "";
        Object.entries(expressionsData)
            .sort((a, b) => b[1] - a[1])
            .forEach(([expression, confidence]) => {
                const li = document.createElement("li");
                li.textContent = `${expression.charAt(0).toUpperCase() + expression.slice(1)}: ${(confidence * 100).toFixed(2)}%`;
                expressionList.appendChild(li);
            });
    }

    // Update Chart Emosi
    // Pastikan expressionChartInstance ada dan ctx yang diteruskan cocok
    if (expressionChartInstance && expressionChartInstance.canvas === expressionChartCtx.canvas) {
        const orderedLabels = Object.keys(CHART_COLORS);
        const orderedData = orderedLabels.map(label => expressionsData[label] || 0);

        expressionChartInstance.data.labels = orderedLabels.map((label) => label.charAt(0).toUpperCase() + label.slice(1));
        expressionChartInstance.data.datasets[0].data = orderedData;
        expressionChartInstance.update();
    } else {
        // Jika instance chart belum diinisialisasi atau tidak cocok, inisialisasi ulang
        initializeExpressionChart(expressionChartCtx);
        // Kemudian perbarui datanya
        if (expressionChartInstance) {
            const orderedLabels = Object.keys(CHART_COLORS);
            const orderedData = orderedLabels.map(label => expressionsData[label] || 0);
            expressionChartInstance.data.labels = orderedLabels.map((label) => label.charAt(0).toUpperCase() + label.slice(1));
            expressionChartInstance.data.datasets[0].data = orderedData;
            expressionChartInstance.update();
        }
    }


    // Update timestamp menggunakan lastDetectedTimestamp
    if (timestampEl) {
        if (lastDetectedTimestamp) {
            const date = new Date(lastDetectedTimestamp);
            const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const formattedDate = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
            timestampEl.textContent = `Terakhir terdeteksi: ${formattedDate}, ${formattedTime}`;
            timestampEl.classList.remove('text-red-500'); // Hapus warna merah jika sebelumnya ada
            timestampEl.classList.add('text-green-600'); // Tambahkan warna hijau untuk deteksi berhasil
        } else {
            // Jika belum ada deteksi sama sekali (atau saat direset)
            timestampEl.textContent = "Belum ada deteksi.";
            timestampEl.classList.add('text-red-500'); // Tambahkan warna merah untuk status belum terdeteksi
            timestampEl.classList.remove('text-green-600');
        }
    }

    // Aktifkan/nonaktifkan tombol simpan berdasarkan dominantEmotion
    if (saveButton) {
        if (dominantEmotion === "Tidak Terdeteksi") {
            saveButton.disabled = true;
            saveButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            saveButton.disabled = false;
            saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

export function resetUI(emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, saveStatusEl) {
    if (emotionResultEl) emotionResultEl.textContent = "Tidak Aktif";
    if (expressionList) expressionList.innerHTML = "<li>Deteksi dihentikan</li>"; // Juga tidak akan berpengaruh
    if (expressionChartCtx && expressionChartInstance) {
        expressionChartInstance.destroy();
        expressionChartInstance = null;
    }
    if (timestampEl) {
        timestampEl.textContent = "-";
        timestampEl.classList.remove('text-green-600', 'text-red-500'); // Hapus semua warna
    }
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (saveStatusEl) saveStatusEl.classList.add("hidden");
}

export function clearCanvas(canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
}
