// Frontend/view/js/decector.js
import { MODEL_PATH } from './constants.js';
import { updateUI, clearCanvas } from './ui.js';

let lastDetectedEmotionData = null; // Menyimpan data emosi terakhir yang BERHASIL dideteksi
let currentDisplaySize = { width: 0, height: 0 };

export async function loadFaceApiModels() {
    try {
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_PATH),
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_PATH),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        ]);
        console.log("All face-api models successfully loaded.");
        return true;
    } catch (error) {
        console.error("Error loading face-api models:", error);
        alert("Gagal memuat model AI. Pastikan file model ada di folder yang benar dan server dapat menyajikannya.");
        return false;
    }
}

export function setDisplaySize(width, height) {
    currentDisplaySize = { width, height };
}

export async function performDetection(video, canvas, emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, saveStatusEl) {
    // Jika video paused atau ended, bersihkan canvas deteksi dan JANGAN PERBARUI UI
    // Ini penting agar UI tetap menampilkan hasil terakhir yang valid.
    if (video.paused || video.ended) {
        clearCanvas(canvas);
        return null;
    }

    const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, currentDisplaySize);
    clearCanvas(canvas); // Bersihkan canvas sebelum menggambar yang baru

    if (resizedDetections && resizedDetections.length > 0) {
        const firstDetection = resizedDetections[0];
        const expressions = firstDetection.expressions;

        let dominantEmotion = "";
        let maxProbability = 0;
        for (const emotion in expressions) {
            if (expressions[emotion] > maxProbability) {
                maxProbability = expressions[emotion];
                dominantEmotion = emotion;
            }
        }

        // Simpan data untuk API HANYA jika ada deteksi wajah yang valid
        lastDetectedEmotionData = {
            happiness_score: expressions.happy || 0,
            sadness_score: expressions.sad || 0,
            anger_score: expressions.angry || 0,
            fear_score: expressions.fearful || 0,
            disgust_score: expressions.disgusted || 0,
            surprise_score: expressions.surprised || 0,
            neutral_score: expressions.neutral || 0,
            dominant_emotion: dominantEmotion,
            timestamp: new Date().toISOString() // Simpan timestamp saat deteksi terjadi
        };

        // Gambar deteksi di webcam (kotak, usia/gender, emosi dominan)
        drawDetectionsOnCanvas(resizedDetections, canvas);

        // Perbarui UI di sidebar (chart, list, teks utama) dengan data deteksi TERBARU
        // TERMASUK timestamp dari deteksi terakhir yang berhasil
        // MEMPERBAIKI URUTAN ARGUMEN UNTUK updateUI
        updateUI(expressions, dominantEmotion, emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, lastDetectedEmotionData.timestamp);

        return lastDetectedEmotionData; // Mengembalikan data deteksi terakhir
    } else {
        // Jika TIDAK ADA wajah terdeteksi dalam FRAME SAAT INI (tapi video masih berjalan),
        // kita ingin UI menunjukkan "Tidak Terdeteksi" untuk frame ini,
        // tetapi kita ingin MEMPERTAHANKAN lastDetectedEmotionData dari deteksi valid sebelumnya.
        // Ini penting agar saat distop, data terakhir yang valid masih bisa diakses.
        // Panggil updateUI dengan status "Tidak Terdeteksi" dan timestamp dari lastDetectedEmotionData jika ada
        // MEMPERBAIKI URUTAN ARGUMEN UNTUK updateUI
        updateUI(
            {}, 
            "Tidak Terdeteksi", 
            emotionResultEl, 
            expressionList, 
            expressionChartCtx, 
            timestampEl, // Ini adalah elemen DOM timestampEl
            saveButton, 
            lastDetectedEmotionData ? lastDetectedEmotionData.timestamp : null // Ini adalah nilai timestamp (string)
        );
        clearCanvas(canvas);
        // lastDetectedEmotionData TIDAK diubah di sini agar tetap menyimpan hasil terakhir yang valid.
        // saveButton akan dinonaktifkan oleh updateUI jika dominantEmotion "Tidak Terdeteksi".
        if (saveStatusEl) saveStatusEl.classList.add("hidden");
        return null; // Tidak ada deteksi yang valid untuk frame ini
    }
}

function drawDetectionsOnCanvas(detections, canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true }); // Tambahkan willReadFrequently

    detections.forEach((detection) => {
        const box = detection.detection.box;

        new faceapi.draw.DrawBox(box, { boxColor: "rgba(16, 185, 129, 0.8)", lineWidth: 2 }).draw(canvas);

        const { age, gender, genderProbability } = detection;
        const genderText = gender.charAt(0).toUpperCase() + gender.slice(1);
        const ageText = `${Math.round(age)} thn`;
        const genderAgeLabel = `${genderText} (${(genderProbability * 100).toFixed(0)}%) - ${ageText}`;
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(box.x, box.y - 25, ctx.measureText(genderAgeLabel).width + 10, 25);
        ctx.font = "16px Inter";
        ctx.fillStyle = "white";
        ctx.fillText(genderAgeLabel, box.x + 5, box.y - 8);

        const expressions = detection.expressions;
        let dominantEmotionText = "";
        let maxProbabilityDisplay = 0;
        Object.entries(expressions).forEach(([emotion, probability]) => {
            if (probability > maxProbabilityDisplay) {
                maxProbabilityDisplay = probability;
                dominantEmotionText = emotion;
            }
        });

        if (dominantEmotionText !== "") {
            const emotionLabelText = `${dominantEmotionText.charAt(0).toUpperCase() + dominantEmotionText.slice(1)} (${(maxProbabilityDisplay * 100).toFixed(0)}%)`;
            const textY = box.y + box.height + 20;
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(box.x, box.y + box.height, ctx.measureText(emotionLabelText).width + 10, 25);
            ctx.font = "16px Inter";
            ctx.fillStyle = "white";
            ctx.fillText(emotionLabelText, box.x + 5, textY - 8);
        }

        if (detection.landmarks) {
            faceapi.draw.drawFaceLandmarks(canvas, detection, { drawLines: true, color: "blue" });
        }
    });
}

export function getLastDetectedEmotionData() {
    return lastDetectedEmotionData;
}

export function resetLastDetectedEmotionData() {
    lastDetectedEmotionData = null; // Ini hanya dipanggil saat tombol START diklik
}