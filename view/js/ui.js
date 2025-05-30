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
        type: "bar", // Anda bisa mengganti ke 'pie' atau 'doughnut' jika lebih sesuai
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
            plugins: {
                legend: { display: false }, // Sembunyikan legenda jika hanya satu dataset
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || "";
                            if (label) label += ": ";
                            if (context.parsed.y !== null) label += (context.parsed.y * 100).toFixed(2) + "%";
                            return label;
                        }
                    }
                }
            },
        },
    });
    return expressionChartInstance;
}

// MODIFIKASI: Hapus parameter ageValue dan ageResultEl
export function updateUI(
    expressionsData,
    dominantEmotion,
    emotionResultEl,
    expressionList,
    expressionChartCtx, // Sebenarnya yang lebih sering digunakan adalah expressionChartInstance
    timestampEl,
    saveButton,
    lastDetectedTimestamp,
    // ageValue, // <-- DIHAPUS
    genderValue,
    genderProbabilityValue,
    // ageResultEl, // <-- DIHAPUS
    genderResultEl,
    genderProbabilityResultEl
) {
    // Update teks emosi dominan
    if (emotionResultEl) {
        const emotionText = dominantEmotion ? dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1) : "Tidak Terdeteksi";
        emotionResultEl.textContent = emotionText;
        if (dominantEmotion === "Tidak Terdeteksi" || !dominantEmotion) {
            emotionResultEl.classList.remove('text-green-700', 'animate-pulse');
            emotionResultEl.classList.add('text-gray-500');
        } else {
            emotionResultEl.classList.add('text-green-700', 'animate-pulse');
            emotionResultEl.classList.remove('text-gray-500');
        }
    }

    // Update list emosi
    if (expressionList) {
        expressionList.innerHTML = ""; // Bersihkan list sebelum mengisi
        if (expressionsData && Object.keys(expressionsData).length > 0) {
            Object.entries(expressionsData)
                .sort((a, b) => b[1] - a[1]) // Urutkan dari probabilitas tertinggi
                .forEach(([expression, confidence]) => {
                    const li = document.createElement("li");
                    li.className = "text-sm text-gray-600 py-1"; // Tambahkan sedikit styling
                    li.textContent = `${expression.charAt(0).toUpperCase() + expression.slice(1)}: ${(confidence * 100).toFixed(1)}%`;
                    expressionList.appendChild(li);
                });
        } else {
            const li = document.createElement("li");
            li.className = "text-sm text-gray-500 py-1";
            li.textContent = "Tidak ada data ekspresi.";
            expressionList.appendChild(li);
        }
    }

    // Update Chart Emosi
    // Pastikan expressionChartInstance ada dan canvas-nya sama dengan context yang diberikan
    if (expressionChartInstance && expressionChartCtx && expressionChartInstance.canvas === expressionChartCtx.canvas) {
        const orderedLabels = Object.keys(CHART_COLORS); // Gunakan urutan dari CHART_COLORS untuk konsistensi
        const orderedData = orderedLabels.map(label => (expressionsData && expressionsData[label] !== undefined) ? expressionsData[label] : 0);
        expressionChartInstance.data.labels = orderedLabels.map((label) => label.charAt(0).toUpperCase() + label.slice(1));
        expressionChartInstance.data.datasets[0].data = orderedData;
        expressionChartInstance.update('none'); // 'none' untuk update tanpa animasi jika diinginkan untuk update cepat
    } else if (expressionChartCtx) {
        // Jika instance belum ada atau canvas berbeda, coba inisialisasi (seharusnya sudah diinisialisasi di main.js)
        console.warn("Expression chart instance might be missing or mismatched. Re-initializing (if possible).");
        // initializeExpressionChart(expressionChartCtx); // Sebaiknya tidak diinisialisasi ulang di sini untuk menghindari loop
    }


    // Update timestamp
    if (timestampEl) {
        if (lastDetectedTimestamp) {
            const date = new Date(lastDetectedTimestamp);
            const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const formattedDate = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
            timestampEl.textContent = `Terdeteksi: ${formattedDate}, ${formattedTime}`;
            timestampEl.classList.remove('text-red-500');
            timestampEl.classList.add('text-gray-700'); // Warna lebih netral
        } else {
            timestampEl.textContent = "Belum ada deteksi.";
            timestampEl.classList.add('text-red-500');
            timestampEl.classList.remove('text-gray-700');
        }
    }

    // HAPUS BLOK UPDATE UI UNTUK USIA
    // if (dominantEmotion && dominantEmotion !== "Tidak Terdeteksi" && ageValue !== null && genderValue !== null) {
    //     if (ageResultEl) ageResultEl.textContent = `${Math.round(ageValue)}`;
    //     // ... (sisa kode age)
    // } else {
    //     if (ageResultEl) ageResultEl.textContent = "-";
    // }

    // Update UI untuk Gender (jika masih digunakan)
    if (genderResultEl && genderProbabilityResultEl) {
        if (dominantEmotion && dominantEmotion !== "Tidak Terdeteksi" && genderValue) {
            genderResultEl.textContent = genderValue.charAt(0).toUpperCase() + genderValue.slice(1);
            if (genderProbabilityValue !== null && genderProbabilityValue !== undefined) {
                genderProbabilityResultEl.textContent = `(${(genderProbabilityValue * 100).toFixed(0)}% yakin)`;
            } else {
                genderProbabilityResultEl.textContent = ''; // Kosongkan jika tidak ada probabilitas
            }
        } else {
            genderResultEl.textContent = "-";
            genderProbabilityResultEl.textContent = "";
        }
    }


    // Aktifkan/nonaktifkan tombol simpan
    if (saveButton) {
        if (dominantEmotion === "Tidak Terdeteksi" || !dominantEmotion || !expressionsData || Object.keys(expressionsData).length === 0) {
            saveButton.disabled = true;
            saveButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            saveButton.disabled = false;
            saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// MODIFIKASI: Hapus parameter ageResultEl
export function resetUI(
    emotionResultEl,
    expressionList,
    expressionChartCtx, // Sebenarnya yang lebih sering digunakan adalah expressionChartInstance
    timestampEl,
    saveButton,
    saveStatusEl,
    // ageResultEl, // <-- DIHAPUS
    genderResultEl,
    genderProbabilityResultEl
) {
    if (emotionResultEl) {
        emotionResultEl.textContent = "Tidak Aktif";
        emotionResultEl.classList.remove('text-green-700', 'animate-pulse');
        emotionResultEl.classList.add('text-gray-500');
    }
    if (expressionList) {
        expressionList.innerHTML = "<li class='text-sm text-gray-500 py-1'>Deteksi dihentikan atau belum dimulai.</li>";
    }
    if (expressionChartInstance && expressionChartCtx && expressionChartInstance.canvas === expressionChartCtx.canvas) {
        const zeroData = Array(expressionChartInstance.data.labels.length).fill(0);
        expressionChartInstance.data.datasets[0].data = zeroData;
        expressionChartInstance.update('none');
    }
    if (timestampEl) {
        timestampEl.textContent = "-";
        timestampEl.classList.remove('text-green-600', 'text-red-500', 'text-gray-700');
    }
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (saveStatusEl) saveStatusEl.classList.add("hidden");

    // HAPUS RESET UI UNTUK USIA
    // if (ageResultEl) ageResultEl.textContent = "-";

    // Reset UI untuk Gender (jika masih digunakan)
    if (genderResultEl) genderResultEl.textContent = "-";
    if (genderProbabilityResultEl) genderProbabilityResultEl.textContent = "";
}

export function clearCanvas(canvas) {
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext("2d");
        if (ctx) { // Pastikan context berhasil didapatkan
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}
