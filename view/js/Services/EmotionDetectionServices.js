import { 
    API_URL_EMOTION_RECORDS, 
    API_URL_EMOTION_HISTORY_SUMMARY, 
    JWT_TOKEN_KEY 
} from "../constants.js";

/**
 * Mengambil token JWT dari localStorage.
 * @returns {string|null} Token JWT atau null jika tidak ada.
 */
function getAuthToken() {
  return localStorage.getItem(JWT_TOKEN_KEY);
}

/**
 * Fungsi helper untuk membuat request fetch dengan header standar.
 * @param {string} fullUrl - URL lengkap untuk API endpoint.
 * @param {object} options - Opsi untuk fetch (method, body, dll.)
 * @returns {Promise<Response>}
 */
async function makeApiRequest(fullUrl, options = {}) {
  const token = getAuthToken();

  if (!token) {
    alert("Anda harus login untuk melakukan tindakan ini.");
    console.error("Error: Token JWT tidak ditemukan.");
    throw new Error("Token JWT tidak ditemukan.");
  }

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(fullUrl, fetchOptions);
}

/**
 * Menyimpan data deteksi emosi baru ke API.
 * @param {object} emotionData - Objek data emosi yang akan dikirim.
 * @returns {Promise<object>} Hasil JSON dari API.
 * @throws {Error} Jika terjadi kesalahan.
 */
export async function saveEmotionRecord(emotionData) {
  const payload = {
    timestamp: emotionData.timestamp,
    dominant_emotion: emotionData.dominant_emotion,
    happines_score: emotionData.happines_score,
    sadness_score: emotionData.sadness_score,
    anger_score: emotionData.anger_score,
    fear_score: emotionData.fear_score,
    disgust_score: emotionData.disgust_score,
    surprise_score: emotionData.surprise_score,
    neutral_score: emotionData.neutral_score,
    age: emotionData.age,
    gender: emotionData.gender,
    gender_probability: emotionData.gender_probability,
  };

  const response = await makeApiRequest(API_URL_EMOTION_RECORDS, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("Gagal menyimpan data emosi:", result);
    throw new Error(result.message || `Gagal menyimpan data: ${response.statusText}`);
  }
  console.log("Data emosi berhasil disimpan:", result);
  return result;
}

/**
 * Mengambil daftar riwayat deteksi emosi (dengan paginasi).
 * @param {number} page - Nomor halaman yang ingin diambil.
 * @param {number} perPage - Jumlah item per halaman.
 * @returns {Promise<object>} Hasil JSON dari API (termasuk data paginasi).
 * @throws {Error} Jika terjadi kesalahan.
 */
export async function fetchEmotionHistory(page = 1, perPage = 15) {
  const queryParams = `?page=${page}&per_page=${perPage}&sort_by=detection_timestamp&sort_order=desc`;
  const fullUrl = `${API_URL_EMOTION_RECORDS}${queryParams}`;

  const response = await makeApiRequest(fullUrl, {
    method: "GET",
  });

  const result = await response.json();
  if (!response.ok) {
    console.error("Gagal mengambil riwayat emosi:", result);
    throw new Error(result.message || `Gagal mengambil riwayat: ${response.statusText}`);
  }
  console.log("Riwayat emosi berhasil diambil:", result);
  return result;
}

/**
 * Mengambil satu catatan emosi spesifik berdasarkan ID.
 * @param {string|number} recordId - ID dari catatan emosi.
 * @returns {Promise<object>} Hasil JSON dari API (data satu record).
 * @throws {Error} Jika terjadi kesalahan.
 */
export async function fetchEmotionRecordById(recordId) {
  const fullUrl = `${API_URL_EMOTION_RECORDS}/${recordId}`;

  const response = await makeApiRequest(fullUrl, {
    method: "GET",
  });

  const result = await response.json();
  if (!response.ok) {
    console.error(`Gagal mengambil catatan emosi ID ${recordId}:`, result);
    throw new Error(result.message || `Gagal mengambil data: ${response.statusText}`);
  }
  console.log(`Catatan emosi ID ${recordId} berhasil diambil:`, result);
  return result;
}

/**
 * Menghapus satu catatan emosi spesifik berdasarkan ID.
 * @param {string|number} recordId - ID dari catatan emosi.
 * @returns {Promise<object>} Hasil JSON dari API (pesan sukses).
 * @throws {Error} Jika terjadi kesalahan.
 */
export async function deleteEmotionRecordById(recordId) {
  const fullUrl = `${API_URL_EMOTION_RECORDS}/${recordId}`;

  const response = await makeApiRequest(fullUrl, {
    method: "DELETE",
  });

  const result = await response.json();
  if (!response.ok) {
    console.error(`Gagal menghapus catatan emosi ID ${recordId}:`, result);
    throw new Error(result.message || `Gagal menghapus data: ${response.statusText}`);
  }
  console.log(`Catatan emosi ID ${recordId} berhasil dihapus:`, result);
  return result;
}

/**
 * Mengambil ringkasan rata-rata skor emosi untuk grafik.
 * @param {string} periodType - 'weekly' atau 'monthly'.
 * @param {object} params - Parameter tambahan seperti { date: 'YYYY-MM-DD' } untuk mingguan,
 * atau { year: YYYY, month: MM } untuk bulanan.
 * @returns {Promise<object>} Objek yang berisi summary_emotion dan average_scores.
 * @throws {Error} Jika terjadi kesalahan.
 */
export async function fetchEmotionSummaryForChart(periodType, params = {}) {
  const queryParams = new URLSearchParams({ period_type: periodType });
  if (periodType === "weekly" && params.date) {
    queryParams.append("date", params.date);
  } else if (periodType === "monthly") {
    if (params.year) queryParams.append("year", params.year);
    if (params.month) queryParams.append("month", params.month);
  }

  const fullUrl = `${API_URL_EMOTION_HISTORY_SUMMARY}?${queryParams.toString()}`;

  const response = await makeApiRequest(fullUrl, {
    method: "GET",
  });

  const result = await response.json();
  if (!response.ok) {
    console.error(`Gagal mengambil ringkasan emosi (${periodType}):`, result);
    throw new Error(result.message || `Gagal mengambil ringkasan: ${response.statusText}`);
  }
  console.log(`Ringkasan emosi (${periodType}) berhasil diambil:`, result);

  return result;
}
