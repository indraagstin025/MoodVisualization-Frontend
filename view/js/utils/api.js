import { API_BASE_URL, JWT_TOKEN_KEY } from "../utils/constants.js";

export async function sendEmotionDataToAPI(data, saveStatusEl) {
  if (saveStatusEl) {
    saveStatusEl.textContent = "Menyimpan data...";
    saveStatusEl.style.color = "orange";
    saveStatusEl.classList.remove("hidden");
  }

  try {
    const jwtToken = localStorage.getItem(JWT_TOKEN_KEY);

    if (!jwtToken) {
      alert("Anda harus login untuk menyimpan data.");
      if (saveStatusEl) {
        saveStatusEl.textContent = "Gagal: Harus login.";
        saveStatusEl.style.color = "red";
      }
      return false;
    }

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      if (saveStatusEl) {
        saveStatusEl.textContent = "Data berhasil disimpan!";
        saveStatusEl.style.color = "green";
        setTimeout(() => saveStatusEl.classList.add("hidden"), 3000);
      }
      console.log("Data berhasil disimpan:", result);
      return true;
    } else {
      if (saveStatusEl) {
        saveStatusEl.textContent = `Gagal menyimpan: ${result.message || response.statusText}`;
        saveStatusEl.style.color = "red";
      }
      console.error("Gagal menyimpan data:", result);
      alert("Gagal menyimpan data emosi. Periksa konsol untuk detail.");
      return false;
    }
  } catch (error) {
    if (saveStatusEl) {
      saveStatusEl.textContent = "Gagal: Kesalahan jaringan atau server.";
      saveStatusEl.style.color = "red";
    }
    console.error("Kesalahan saat mengirim data:", error);
    alert("Terjadi kesalahan saat mengirim data. Pastikan API berjalan dan CORS sudah dikonfigurasi.");
    return false;
  }
}
