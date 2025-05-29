import { MODEL_PATH } from "./constants.js";
import { updateUI, clearCanvas } from "./ui.js";

let lastDetectedEmotionData = null;
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

export async function performDetection(video, canvas, emotionResultEl, expressionList, expressionChartCtx, timestampEl, saveButton, saveStatusEl, ageResultEl, genderResultEl, genderProbabilityResultEl) {
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
  clearCanvas(canvas);

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

    const age = firstDetection.age;
    const gender = firstDetection.gender;
    const genderProbability = firstDetection.genderProbability;

    lastDetectedEmotionData = {
      happines_score: expressions.happy || 0,
      sadness_score: expressions.sad || 0,
      anger_score: expressions.angry || 0,
      fear_score: expressions.fearful || 0,
      disgust_score: expressions.disgusted || 0,
      surprise_score: expressions.surprised || 0,
      neutral_score: expressions.neutral || 0,
      dominant_emotion: dominantEmotion,
      timestamp: new Date().toISOString(),

      age: age ? Math.round(age) : null,
      gender: gender || null,
      gender_probability: genderProbability || null,
    };

    drawDetectionsOnCanvas(resizedDetections, canvas);

    updateUI(
      expressions,
      dominantEmotion,
      emotionResultEl,
      expressionList,
      expressionChartCtx,
      timestampEl,
      saveButton,
      lastDetectedEmotionData.timestamp,
      age,
      gender,
      genderProbability,
      ageResultEl,
      genderResultEl,
      genderProbabilityResultEl
    );

    return lastDetectedEmotionData;
  } else {
    updateUI(
      {},
      "Tidak Terdeteksi",
      emotionResultEl,
      expressionList,
      expressionChartCtx,
      timestampEl,
      saveButton,
      lastDetectedEmotionData ? lastDetectedEmotionData.timestamp : null,
      null,
      null,
      null,
      ageResultEl,
      genderResultEl,
      genderProbabilityResultEl
    );
    clearCanvas(canvas);

    if (saveStatusEl) saveStatusEl.classList.add("hidden");

    return null;
  }
}

function drawDetectionsOnCanvas(detections, canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  detections.forEach((detection) => {
    const box = detection.detection.box;

    new faceapi.draw.DrawBox(box, {
      boxColor: "rgba(16, 185, 129, 0.8)",
      lineWidth: 2,
    }).draw(canvas);

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
      faceapi.draw.drawFaceLandmarks(canvas, detection, {
        drawLines: true,
        color: "blue",
      });
    }
  });
}

export function getLastDetectedEmotionData() {
  return lastDetectedEmotionData;
}

export function resetLastDetectedEmotionData() {
  lastDetectedEmotionData = null;
}
