import { startWebcamStream, stopWebcamStream } from "./components/webcam.js";
import { loadFaceApiModels, performDetection, setDisplaySize, getLastDetectedEmotionData, resetLastDetectedEmotionData } from "./detector.js";
import { saveEmotionRecord } from "./Services/EmotionDetectionServices.js";
import { initializeExpressionChart, resetUI, clearCanvas } from "./components/ui.js";

document.addEventListener("DOMContentLoaded", async () => {
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

  const genderResultEl = document.getElementById("genderResult");
  const genderProbabilityResultEl = document.getElementById("genderProbabilityResult");

  let detectionInterval = null;
  let expressionChart = null;

  if (!video) console.error("Element video (id 'video') not found!");
  if (!canvas) console.error("Element canvas (id 'overlay') not found!");
  if (!startButton) console.warn("Element for start button (id 'startButton') not found.");
  if (!stopButton) console.warn("Element for stop button (id 'stopButton') not found.");
  if (!expressionChartCtx) console.warn("Canvas element for expression chart (id 'expressionChartCanvas') not found. Chart will not be displayed.");
  if (!emotionResultEl) console.warn("Element for emotion result (id 'emotionResult') not found.");
  if (!timestampEl) console.warn("Element for timestamp (id 'timestamp') not found.");
  if (!saveButton) console.warn("Element for save button (id 'saveButton') not found.");
  if (!saveStatusEl) console.warn("Element for save status (id 'saveStatus') not found.");
  if (!expressionList) console.warn("Element for expression list (id 'expressionList') not found. List of all expressions will not be displayed.");

  if (!genderResultEl) console.warn("Element for gender result (id 'genderResult') not found.");
  if (!genderProbabilityResultEl) console.warn("Element for gender probability (id 'genderProbabilityResult') not found.");

  if (loadingModelsEl) loadingModelsEl.classList.remove("hidden");
  const modelsLoaded = await loadFaceApiModels();
  if (loadingModelsEl) loadingModelsEl.classList.add("hidden");

  if (!modelsLoaded) {
    if (startButton) startButton.disabled = true;
    if (stopButton) stopButton.disabled = true;
    if (saveButton) saveButton.disabled = true;
    alert("Model AI gagal dimuat. Fitur deteksi tidak akan berfungsi.");
    return;
  }
  if (saveButton) saveButton.disabled = true;
  if (stopButton) stopButton.disabled = true;

  video.addEventListener("loadedmetadata", () => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setDisplaySize(video.videoWidth, video.videoHeight);
      faceapi.matchDimensions(canvas, { width: video.videoWidth, height: video.videoHeight });
      console.log("Video metadata loaded, canvas resized.");
    } else {
      console.warn("Video metadata loaded but video dimensions are zero.");
    }
  });

  video.addEventListener("playing", () => {
    console.log("Video is playing. Initializing chart and detection interval.");
    if (expressionChartCtx && !expressionChart) {
      expressionChart = initializeExpressionChart(expressionChartCtx);
    }
    if (detectionInterval) {
      clearInterval(detectionInterval);
    }
    detectionInterval = setInterval(async () => {
      await performDetection(
        video,
        canvas,
        emotionResultEl,
        expressionList,
        expressionChartCtx,
        timestampEl,
        saveButton,
        saveStatusEl,

        genderResultEl,
        genderProbabilityResultEl
      );
    }, 200);
  });

  if (startButton) {
    startButton.addEventListener("click", async () => {
      if (startButton.disabled) return;

      startButton.disabled = true;
      if (stopButton) stopButton.disabled = false;

      resetUI(
        emotionResultEl,
        expressionList,
        expressionChartCtx,
        timestampEl,
        saveButton,
        saveStatusEl,

        genderResultEl,
        genderProbabilityResultEl
      );
      clearCanvas(canvas);
      resetLastDetectedEmotionData();

      try {
        await startWebcamStream(video);
        console.log("Webcam stream started.");
      } catch (error) {
        console.error("Failed to start webcam:", error);
        if (startButton) startButton.disabled = false;
        if (stopButton) stopButton.disabled = true;
        if (emotionResultEl) emotionResultEl.textContent = "Gagal memulai webcam";
        alert("Gagal memulai webcam. Pastikan kamera tersedia dan diizinkan.");
      }
    });
  }

  if (stopButton) {
    stopButton.addEventListener("click", () => {
      if (stopButton.disabled) return;

      stopButton.disabled = true;
      if (startButton) startButton.disabled = false;

      if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
      }
      stopWebcamStream(video);
      clearCanvas(canvas);

      if (saveButton) {
        const lastData = getLastDetectedEmotionData();
        if (lastData) {
          saveButton.disabled = false;
          console.log("Detection stopped. Last detected data is available for saving.");
        } else {
          saveButton.disabled = true;
          console.log("Detection stopped. No data available to save.");
        }
      }
      if (saveStatusEl) saveStatusEl.classList.add("hidden");
    });
  }

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
        resetLastDetectedEmotionData();
      } catch (error) {
        console.error("Error saat menyimpan data melalui service:", error);
        if (saveStatusEl) {
          saveStatusEl.textContent = `Gagal menyimpan: ${error.message || "Error tidak diketahui"}`;
          saveStatusEl.style.color = "red";
        }
      } finally {
        if (saveButton && !getLastDetectedEmotionData()) {
          saveButton.disabled = true;
        } else if (saveButton) {
          saveButton.disabled = false;
        }
      }
    });
  }
});
