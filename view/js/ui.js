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

// MODIFIKASI: Tambahkan parameter untuk age, gender, dan elemennya
export function updateUI(
    expressionsData,
    dominantEmotion,
    emotionResultEl,
    expressionList,
    expressionChartCtx,
    timestampEl,
    saveButton,
    lastDetectedTimestamp,
    // Parameter BARU untuk nilai age/gender
    ageValue,
    genderValue,
    genderProbabilityValue,
    // Parameter BARU untuk elemen DOM age/gender
    ageResultEl,
    genderResultEl,
    genderProbabilityResultEl
) {
    // Update teks emosi dominan
    if (emotionResultEl) {
        emotionResultEl.textContent = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);
        // Anda bisa menambahkan logika untuk mengubah warna atau kelas berdasarkan emosi jika mau
        if (dominantEmotion === "Tidak Terdeteksi") {
            emotionResultEl.classList.remove('text-green-700', 'animate-pulse');
            emotionResultEl.classList.add('text-gray-500');
        } else {
            emotionResultEl.classList.add('text-green-700', 'animate-pulse');
            emotionResultEl.classList.remove('text-gray-500');
        }
    }

    // Update list emosi (tetap sama)
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

    // Update Chart Emosi (tetap sama)
    if (expressionChartInstance && expressionChartInstance.canvas === expressionChartCtx.canvas) {
        const orderedLabels = Object.keys(CHART_COLORS);
        const orderedData = orderedLabels.map(label => expressionsData[label] || 0);
        expressionChartInstance.data.labels = orderedLabels.map((label) => label.charAt(0).toUpperCase() + label.slice(1));
        expressionChartInstance.data.datasets[0].data = orderedData;
        expressionChartInstance.update();
    } else if (expressionChartCtx) { // Hanya inisialisasi jika ctx ada
        initializeExpressionChart(expressionChartCtx);
        if (expressionChartInstance) {
            const orderedLabels = Object.keys(CHART_COLORS);
            const orderedData = orderedLabels.map(label => expressionsData[label] || 0);
            expressionChartInstance.data.labels = orderedLabels.map((label) => label.charAt(0).toUpperCase() + label.slice(1));
            expressionChartInstance.data.datasets[0].data = orderedData;
            expressionChartInstance.update();
        }
    }

    // Update timestamp (tetap sama)
    if (timestampEl) {
        if (lastDetectedTimestamp) {
            const date = new Date(lastDetectedTimestamp);
            const formattedTime = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const formattedDate = date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
            timestampEl.textContent = `Terakhir terdeteksi: ${formattedDate}, ${formattedTime}`;
            timestampEl.classList.remove('text-red-500');
            timestampEl.classList.add('text-green-600');
        } else {
            timestampEl.textContent = "Belum ada deteksi.";
            timestampEl.classList.add('text-red-500');
            timestampEl.classList.remove('text-green-600');
        }
    }

    // BARU: Update UI untuk Usia dan Gender
    if (dominantEmotion && dominantEmotion !== "Tidak Terdeteksi" && ageValue !== null && genderValue !== null) {
        if (ageResultEl) ageResultEl.textContent = `${Math.round(ageValue)}`;
        if (genderResultEl) genderResultEl.textContent = genderValue.charAt(0).toUpperCase() + genderValue.slice(1); // Kapitalisasi gender
        if (genderProbabilityResultEl && genderProbabilityValue !== null) {
            genderProbabilityResultEl.textContent = `(${(genderProbabilityValue * 100).toFixed(0)}% yakin)`;
        } else if (genderProbabilityResultEl) {
            genderProbabilityResultEl.textContent = '(-)';
        }
    } else {
        // Jika tidak ada deteksi valid, reset tampilan usia/gender
        if (ageResultEl) ageResultEl.textContent = "-";
        if (genderResultEl) genderResultEl.textContent = "-";
        if (genderProbabilityResultEl) genderProbabilityResultEl.textContent = "(-)";
    }

    // Aktifkan/nonaktifkan tombol simpan (tetap sama)
    if (saveButton) {
        if (dominantEmotion === "Tidak Terdeteksi" || Object.keys(expressionsData).length === 0) { // Tambahkan pengecekan expressionsData
            saveButton.disabled = true;
            saveButton.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            saveButton.disabled = false;
            saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// MODIFIKASI: Tambahkan parameter untuk elemen DOM age/gender
export function resetUI(
    emotionResultEl,
    expressionList,
    expressionChartCtx,
    timestampEl,
    saveButton,
    saveStatusEl,
    // Parameter BARU untuk elemen DOM age/gender
    ageResultEl,
    genderResultEl,
    genderProbabilityResultEl
) {
    if (emotionResultEl) {
        emotionResultEl.textContent = "Tidak Aktif"; // Atau "Tidak Terdeteksi"
        emotionResultEl.classList.remove('text-green-700', 'animate-pulse');
        emotionResultEl.classList.add('text-gray-500');
    }
    if (expressionList) expressionList.innerHTML = "<li>Deteksi dihentikan</li>";
    if (expressionChartCtx && expressionChartInstance) {
        // Reset data chart ke 0 daripada menghancurkan dan membuat ulang
        const zeroData = Array(expressionChartInstance.data.labels.length).fill(0);
        expressionChartInstance.data.datasets[0].data = zeroData;
        expressionChartInstance.update();
    }
    if (timestampEl) {
        timestampEl.textContent = "-";
        timestampEl.classList.remove('text-green-600', 'text-red-500');
    }
    if (saveButton) {
        saveButton.disabled = true;
        saveButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    if (saveStatusEl) saveStatusEl.classList.add("hidden");

    // BARU: Reset UI untuk Usia dan Gender
    if (ageResultEl) ageResultEl.textContent = "-";
    if (genderResultEl) genderResultEl.textContent = "-";
    if (genderProbabilityResultEl) genderProbabilityResultEl.textContent = "(-)";
}

export function clearCanvas(canvas) {
    if (canvas && canvas.getContext) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }
}