// Frontend/view/js/main.js
import { startWebcamStream, stopWebcamStream } from './webcam.js';
import { loadFaceApiModels, performDetection, setDisplaySize, getLastDetectedEmotionData, resetLastDetectedEmotionData } from './decector.js';
import { sendEmotionDataToAPI } from './api.js';
import { initializeExpressionChart, resetUI, clearCanvas } from './ui.js';

document.addEventListener("DOMContentLoaded", async () => {
    // --- 1. Deklarasi Elemen DOM ---
    const video = document.getElementById("video");
    const canvas = document.getElementById("overlay");
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const saveButton = document.getElementById("saveButton");
    const saveStatusEl = document.getElementById("saveStatus");
    const emotionResultEl = document.getElementById("emotionResult");
    const timestampEl = document.getElementById("timestamp");
    const expressionList = document.getElementById("expressionList");
    const expressionChartCanvas = document.getElementById("expressionChartCanvas");
    const expressionChartCtx = expressionChartCanvas?.getContext("2d", { willReadFrequently: true }); // Tambahkan willReadFrequently
    const loadingModelsEl = document.getElementById("loadingModels"); // Tambahkan ini jika Anda mengikuti saran UX

    let detectionInterval = null;
    let expressionChart = null; // Menyimpan instance chart

    // Konsol warning (tetap sama)
    if (!expressionChartCtx) console.warn("Canvas element for expression chart (id 'expressionChartCanvas') not found. Chart will not be displayed.");
    if (!emotionResultEl) console.warn("Element for emotion result (id 'emotionResult') not found.");
    if (!timestampEl) console.warn("Element for timestamp (id 'timestamp') not found.");
    if (!saveButton) console.warn("Element for save button (id 'saveButton') not found.");
    if (!saveStatusEl) console.warn("Element for save status (id 'saveStatus') not found.");
    if (!expressionList) console.warn("Element for expression list (id 'expressionList') not found. List of all expressions will not be displayed.");


    // --- 2. Pemuatan Model AI ---
    if (loadingModelsEl) loadingModelsEl.classList.remove("hidden"); // Tampilkan loading
    const modelsLoaded = await loadFaceApiModels();
    if (loadingModelsEl) loadingModelsEl.classList.add("hidden"); // Sembunyikan loading

    if (!modelsLoaded) {
        if (startButton) startButton.disabled = true;
        if (stopButton) stopButton.disabled = true;
        if (saveButton) saveButton.disabled = true;
        return; // Hentikan eksekusi jika model gagal dimuat
    }
    // saveButton awalnya dinonaktifkan sampai ada deteksi pertama yang valid atau sampai distop dengan hasil
    if (saveButton) saveButton.disabled = true;


    // --- 3. Event Listeners ---

    // Saat metadata video sudah dimuat (untuk ukuran canvas)
    video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setDisplaySize(video.videoWidth, video.videoHeight); // Mengatur ukuran tampilan di decector.js
        faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });
    });

    // Saat video mulai diputar
    video.addEventListener("playing", () => {
        if (expressionChartCtx) {
            expressionChart = initializeExpressionChart(expressionChartCtx);
        }

        // Hentikan interval lama jika ada
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }

        // Mulai deteksi secara berkala
        detectionInterval = setInterval(async () => {
            // Kita mengirim elemen-elemen DOM yang diperlukan ke performDetection
            await performDetection(video, canvas, emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, saveStatusEl);
        }, 200); // Setiap 200ms
    });


    // Tombol Start
    startButton.addEventListener("click", async () => {
        if (startButton.disabled) return;

        startButton.disabled = true;
        stopButton.disabled = false;
        // Reset tampilan UI sepenuhnya HANYA saat START baru
        resetUI(emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, saveStatusEl);
        clearCanvas(canvas); // Bersihkan canvas gambar deteksi
        resetLastDetectedEmotionData(); // Reset data yang akan disimpan HANYA saat memulai sesi baru

        try {
            await startWebcamStream(video); // Mulai stream webcam
            console.log("Webcam stream started.");
        } catch (error) {
            console.error("Failed to start webcam:", error);
            startButton.disabled = false;
            stopButton.disabled = true;
            if (emotionResultEl) emotionResultEl.textContent = "Gagal memulai webcam";
            alert("Gagal memulai webcam. Pastikan kamera tersedia dan diizinkan.");
        }
    });

    // Tombol Stop (Manual)
    stopButton.addEventListener("click", () => {
        if (stopButton.disabled) return;

        stopButton.disabled = true;
        startButton.disabled = false;

        // Hentikan interval deteksi
        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }

        // Hentikan stream webcam
        stopWebcamStream(video);

        // Bersihkan hanya gambar deteksi di canvas (kotak, label),
        // JANGAN PANGGIL resetUI() DI SINI agar hasil terakhir tetap terlihat di UI.
        clearCanvas(canvas);

        // Aktifkan tombol save jika ada data terakhir yang terdeteksi
        // Ini akan mengambil data terakhir dari decector.js
        if (saveButton) {
            if (getLastDetectedEmotionData()) {
                saveButton.disabled = false; // Aktifkan jika ada data
            } else {
                saveButton.disabled = true; // Nonaktifkan jika tidak ada data sama sekali
            }
        }
        // Pastikan status penyimpanan disembunyikan
        if (saveStatusEl) saveStatusEl.classList.add("hidden");

        console.log("Detection stopped manually. Last results are preserved.");
    });

    // Tombol Save
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            const dataToSave = getLastDetectedEmotionData(); // Dapatkan data terakhir yang terdeteksi

            if (!dataToSave) {
                alert("Tidak ada data emosi yang terdeteksi untuk disimpan. Harap mulai deteksi wajah terlebih dahulu.");
                return;
            }
            // Tambahkan disable/enable tombol save saat proses pengiriman
            saveButton.disabled = true;
            if (saveStatusEl) { // Pastikan elemen ada sebelum diakses
                saveStatusEl.classList.remove("hidden");
                saveStatusEl.textContent = "Menyimpan data...";
            }
            try {
                await sendEmotionDataToAPI(dataToSave, saveStatusEl);
                if (saveStatusEl) saveStatusEl.textContent = "Data berhasil disimpan!";
            } catch (error) {
                console.error("Error saving data:", error);
                if (saveStatusEl) {
                    saveStatusEl.textContent = `Gagal menyimpan data: ${error.message || "Error tidak diketahui"}`;
                    saveStatusEl.classList.add("text-red-500"); // Ubah warna teks jika error
                }
            } finally {
                if (saveButton) saveButton.disabled = false; // Selalu aktifkan kembali tombol save
            }
        });
    }
});