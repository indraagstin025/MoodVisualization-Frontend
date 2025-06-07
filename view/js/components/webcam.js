export function startWebcamStream(videoElement) {
  return new Promise((resolve, reject) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            resolve(stream);
          };
        })
        .catch((err) => {
          console.error("Error accessing webcam: ", err);
          alert("Tidak dapat mengakses webcam. Pastikan Anda memberikan izin dan tidak ada aplikasi lain yang menggunakannya.");
          reject(err);
        });
    } else {
      alert("Browser Anda tidak mendukung akses kamera (getUserMedia).");
      reject(new Error("getUserMedia not supported"));
    }
  });
}

export function stopWebcamStream(videoElement) {
  if (videoElement.srcObject) {
    videoElement.srcObject.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
}
