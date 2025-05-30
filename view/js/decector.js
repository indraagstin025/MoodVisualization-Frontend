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

export async function performDetection(
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
) {
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

    const gender = firstDetection.gender;
    const genderProbability = firstDetection.genderProbability;

    lastDetectedEmotionData = {
      happiness_score: expressions.happy || 0,
      sadness_score: expressions.sad || 0,
      anger_score: expressions.angry || 0,
      fear_score: expressions.fearful || 0,
      disgust_score: expressions.disgusted || 0,
      surprise_score: expressions.surprised || 0,
      neutral_score: expressions.neutral || 0,
      dominant_emotion: dominantEmotion,
      timestamp: new Date().toISOString(),

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

      gender,
      genderProbability,

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
      lastDetectedEmotionData ? lastDetectedEmotionData.timestamp : new Date().toISOString(),

      null,
      null,

      genderResultEl,
      genderProbabilityResultEl
    );
    clearCanvas(canvas);

    if (saveStatusEl) saveStatusEl.classList.add("hidden");
    lastDetectedEmotionData = null;
    if (saveButton) saveButton.disabled = true;

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

    const { gender, genderProbability } = detection;

    if (gender && genderProbability !== undefined) {
      const genderText = gender.charAt(0).toUpperCase() + gender.slice(1);

      const genderLabel = `${genderText} (${(genderProbability * 100).toFixed(0)}%)`;

      const textX = box.x;
      const textYAbove = box.y - 8;
      const padding = 5;
      const textMetrics = ctx.measureText(genderLabel);
      const textWidth = textMetrics.width;
      const textHeight = 20;

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(textX, box.y - textHeight - 2, textWidth + padding * 2, textHeight);
      ctx.font = "16px Inter";
      ctx.fillStyle = "white";
      ctx.fillText(genderLabel, textX + padding, textYAbove);
    }

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
      const textYBelow = box.y + box.height + 20;

      const padding = 5;
      const textMetrics = ctx.measureText(emotionLabelText);
      const textWidth = textMetrics.width;
      const textHeight = 20;

      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(box.x, box.y + box.height + 2, textWidth + padding * 2, textHeight);
      ctx.font = "16px Inter";
      ctx.fillStyle = "white";
      ctx.fillText(emotionLabelText, box.x + padding, textYBelow - textHeight / 2 + 8);
    }

    if (detection.landmarks) {
      faceapi.draw.drawFaceLandmarks(canvas, detection.landmarks, {
        drawLines: true,
        color: "rgba(0, 0, 255, 0.5)",
        lineWidth: 1,
      });
    }

    if (detection.landmarks) {
      const landmarks = detection.landmarks;
      const drawOptions = {
        lineWidth: 1,
        drawLines: true,
        color: "rgba(0, 0, 255, 0.5)",
      };
      faceapi.draw.drawFaceLandmarks(canvas, landmarks, drawOptions);
    }
  });
}

export function getLastDetectedEmotionData() {
  return lastDetectedEmotionData;
}

export function resetLastDetectedEmotionData() {
  lastDetectedEmotionData = null;
}
