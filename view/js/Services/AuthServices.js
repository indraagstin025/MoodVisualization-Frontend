const API_BASE_URL = "http://localhost:8000";

/**
 * Mengirim data registrasi pengguna ke API.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @param {string} passwordConfirmation
 * @returns {Promise<Object>} Respons dari API
 * @throws {Error} Jika terjadi kesalahan jaringan atau respons API tidak berhasil.
 */
export async function registerUser(username, email, password, passwordConfirmation) {
  const formData = {
    username: username,
    email: email,
    password: password,
    password_confirmation: passwordConfirmation,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      let errorMessage = "Registrasi gagal. Mohon coba lagi.";
      if (result.message) {
        errorMessage = result.message;
      } else if (result.errors) {
        errorMessage = Object.values(result.errors).flat().join("\n");
      }
      const error = new Error(errorMessage);
      error.response = { data: result };
      error.statusCode = response.status;
      throw error;
    }

    return result;
  } catch (error) {
    console.error("Error in registerUser (AuthServices):", error);

    const customError = new Error(error.message || "Terjadi kesalahan jaringan.");
    customError.originalError = error;
    throw customError;
  }
}

/**
 * Mengirim data login pengguna ke API.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Respons dari API yang berisi token.
 * @throws {Error} Jika terjadi kesalahan jaringan atau respons API tidak berhasil.
 */
export async function loginUser(email, password) {
  const formData = { email, password };
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      let errorMessage = "Login gagal. Email atau password salah.";
      if (result.message) {
        errorMessage = result.message;
      }
      const error = new Error(errorMessage);
      error.response = { data: result };
      error.statusCode = response.status;
      throw error;
    }

    console.log("Data yang dikembalikan dari API login di AuthServices:", result);
    return result;
  } catch (error) {
    console.error("Error in loginUser (AuthServices):", error);

    const customError = new Error(error.message || "Terjadi kesalahan jaringan.");
    customError.originalError = error;
    throw customError;
  }
}

/**
 * Melakukan logout pengguna.
 * @returns {void}
 */
export function logoutUser() {
  localStorage.removeItem("jwt_token");

  window.location.href = "login.html";
}

/**
 * Mengambil informasi pengguna yang sedang login.
 * @returns {Promise<Object>} Data pengguna.
 * @throws {Error} Jika tidak ada token atau request gagal.
 */
export async function getLoggedInUser() {
  const token = localStorage.getItem("jwt_token");
  if (!token) {
    throw new Error("Tidak ada token autentikasi.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      let errorMessage = "Gagal mengambil data pengguna.";
      if (result.message) {
        errorMessage = result.message;
      }
      const error = new Error(errorMessage);
      error.response = { data: result };
      error.statusCode = response.status;
      throw error;
    }

    return result;
  } catch (error) {
    console.error("Error in getLoggedInUser (AuthServices):", error);

    const customError = new Error(error.message || "Terjadi kesalahan jaringan.");
    customError.originalError = error;
    throw customError;
  }
}
