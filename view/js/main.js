// Frontend/view/js/main.js
import { startWebcamStream, stopWebcamStream } from './webcam.js';
import { loadFaceApiModels, performDetection, setDisplaySize, getLastDetectedEmotionData, resetLastDetectedEmotionData } from './decector.js'; // Harusnya detector.js
// import { sendEmotionDataToAPI } from './api.js'; // Impor ini sudah tidak digunakan
import { saveEmotionRecord } from './Services/EmotionDetectionServices.js'; // Menggunakan service baru
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
    const expressionChartCtx = expressionChartCanvas?.getContext("2d", { willReadFrequently: true });
    const loadingModelsEl = document.getElementById("loadingModels");

    // BARU: Deklarasi elemen untuk usia, jenis kelamin, dan probabilitas
    const ageResultEl = document.getElementById("ageResult");
    const genderResultEl = document.getElementById("genderResult");
    const genderProbabilityResultEl = document.getElementById("genderProbabilityResult");

    let detectionInterval = null;
    let expressionChart = null;

    // Konsol warning
    if (!expressionChartCtx) console.warn("Canvas element for expression chart (id 'expressionChartCanvas') not found. Chart will not be displayed.");
    if (!emotionResultEl) console.warn("Element for emotion result (id 'emotionResult') not found.");
    if (!timestampEl) console.warn("Element for timestamp (id 'timestamp') not found.");
    if (!saveButton) console.warn("Element for save button (id 'saveButton') not found.");
    if (!saveStatusEl) console.warn("Element for save status (id 'saveStatus') not found.");
    if (!expressionList) console.warn("Element for expression list (id 'expressionList') not found. List of all expressions will not be displayed.");
    // BARU: Tambahkan warning untuk elemen baru
    if (!ageResultEl) console.warn("Element for age result (id 'ageResult') not found.");
    if (!genderResultEl) console.warn("Element for gender result (id 'genderResult') not found.");
    if (!genderProbabilityResultEl) console.warn("Element for gender probability (id 'genderProbabilityResult') not found.");


    // --- 2. Pemuatan Model AI ---
    if (loadingModelsEl) loadingModelsEl.classList.remove("hidden");
    const modelsLoaded = await loadFaceApiModels();
    if (loadingModelsEl) loadingModelsEl.classList.add("hidden");

    if (!modelsLoaded) {
        if (startButton) startButton.disabled = true;
        if (stopButton) stopButton.disabled = true;
        if (saveButton) saveButton.disabled = true;
        return;
    }
    if (saveButton) saveButton.disabled = true;

    // --- 3. Event Listeners ---

    video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setDisplaySize(video.videoWidth, video.videoHeight);
        faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });
    });

    video.addEventListener("playing", () => {
        if (expressionChartCtx) {
            expressionChart = initializeExpressionChart(expressionChartCtx);
        }
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
        detectionInterval = setInterval(async () => {
            // MODIFIKASI: Teruskan elemen DOM baru ke performDetection
            await performDetection(
                video, canvas, 
                emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, saveStatusEl,
                ageResultEl, genderResultEl, genderProbabilityResultEl // <-- ELEMEN BARU DITERUSKAN
            );
        }, 200);
    });

    startButton.addEventListener("click", async () => {
        if (startButton.disabled) return;

        startButton.disabled = true;
        stopButton.disabled = false;
        // MODIFIKASI: Teruskan elemen DOM baru ke resetUI
        resetUI(
            emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, saveStatusEl,
            ageResultEl, genderResultEl, genderProbabilityResultEl // <-- ELEMEN BARU DITERUSKAN
        );
        clearCanvas(canvas);
        resetLastDetectedEmotionData();

        try {
            await startWebcamStream(video);
            console.log("Webcam stream started.");
        } catch (error) {
            console.error("Failed to start webcam:", error);
            startButton.disabled = false;
            stopButton.disabled = true;
            if (emotionResultEl) emotionResultEl.textContent = "Gagal memulai webcam";
            alert("Gagal memulai webcam. Pastikan kamera tersedia dan diizinkan.");
        }
    });

    stopButton.addEventListener("click", () => {
        if (stopButton.disabled) return;

        stopButton.disabled = true;
        startButton.disabled = false;

        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }
        stopWebcamStream(video);
        clearCanvas(canvas);

        if (saveButton) {
            if (getLastDetectedEmotionData()) {
                saveButton.disabled = false;
            } else {
                saveButton.disabled = true;
            }
        }
        if (saveStatusEl) saveStatusEl.classList.add("hidden");
        console.log("Detection stopped manually. Last results are preserved.");
    });

    // Tombol Save (kode ini sudah benar dari sebelumnya)
    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            const dataToSave = getLastDetectedEmotionData();

            if (!dataToSave) {
                alert("Tidak ada data emosi yang terdeteksi untuk disimpan. Harap mulai deteksi wajah terlebih dahulu.");
                return;
            }
            
            console.log("Data yang akan dikirim ke service:", JSON.stringify(dataToSave, null, 2));

            saveButton.disabled = true;
            if (saveStatusEl) {
                saveStatusEl.classList.remove("hidden", "text-red-500", "text-green-500");
                saveStatusEl.style.color = "orange";
                saveStatusEl.textContent = "Menyimpan data...";
            }

            try {
                const result = await saveEmotionRecord(dataToSave);
                
                if (saveStatusEl) {
                    saveStatusEl.textContent = result.message || "Data berhasil disimpan!";
                    saveStatusEl.style.color = "green";
                    setTimeout(() => {
                        if (saveStatusEl) saveStatusEl.classList.add("hidden");
                    }, 3000);
                }
                console.log("Data berhasil disimpan melalui service:", result);

            } catch (error) {
                console.error("Error saat menyimpan data melalui service:", error);
                if (saveStatusEl) {
                    saveStatusEl.textContent = `Gagal menyimpan: ${error.message || "Error tidak diketahui"}`;
                    saveStatusEl.style.color = "red";
                }
            } finally {
                if (saveButton) saveButton.disabled = false;
            }
        });
    }
});