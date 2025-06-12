const API_BASE_URL = "http://localhost:8000";

/**
 * Mengirim data registrasi pengguna ke API.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @param {string} passwordConfirmation
 * @returns {Promise<Object>} Respons dari API
 * @throws {Error} Jika terjadi kesalahan jaringan atau respons API tidak berhasil.
 */
export async function registerUser(name, email, password, passwordConfirmation) {
  // Objek formData tidak lagi memerlukan 'role'
  const formData = {
    name: name,
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
      
      // Logika ini sudah sangat baik dan akan menangkap error baru dari backend
      if (result.message) {
        errorMessage = result.message; // Akan menangkap "No teachers available in the system."
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
    // Teruskan error yang sudah diformat atau buat yang baru jika error jaringan
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

/**
 * Mengirim data pembaruan profil pengguna ke API.
 * @param {FormData} formData - Objek FormData yang berisi data dari form (termasuk file).
 * @returns {Promise<Object>} Respons dari API yang berisi data user terupdate.
 * @throws {Error} Jika terjadi kesalahan jaringan atau respons API tidak berhasil.
 */


export async function updateUserProfile(formData) {
  const token = localStorage.getItem("jwt_token");
  if (!token) {
    throw new Error("Tidak ada token autentikasi. Silakan login kembali.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: "POST", 
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    
    const result = await response.json();

    
    if (!response.ok) {
        
        
        
        let errorMessage = "Gagal mengupdate profil."; 
        
        
        if (result.errors) {
            
            errorMessage = Object.values(result.errors).flat().join(' ');
        } else if (result.message) {
            
            errorMessage = result.message;
        }
        
        
        throw new Error(errorMessage);
    }

    
    localStorage.setItem('user', JSON.stringify(result.user));
    console.log("Profil berhasil diupdate, data baru di localStorage:", result.user);
    return result;

  } catch (error) {
    console.error("Error in updateUserProfile (AuthServices):", error);
    
    throw error;
  }
}



/**
 * Membuat pengguna baru melalui endpoint admin.
 * @param {Object} userData - Objek berisi name, email, password, dan role.
 * @returns {Promise<Object>} Respons dari API.
 */
export async function createUserByAdmin(userData) {
  const token = localStorage.getItem("jwt_token");
  if (!token) {
    throw new Error("Token otentikasi admin tidak ditemukan.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    
    
    
    if (!response.ok) {
      let errorMessage = "Gagal membuat pengguna baru.";
      
      
      if (result.errors) {
        
        errorMessage = Object.values(result.errors).flat().join(' ');
      } else if (result.message) {
        
        errorMessage = result.message;
      }
      
      throw new Error(errorMessage);
    }
    

    return result;
  } catch (error) {
    console.error("Error in createUserByAdmin:", error);
    throw error;
  }
}



/**
 * Mengambil daftar semua pengguna dari endpoint admin.
 * @returns {Promise<Array>} Array berisi objek pengguna.
 */
export async function getAllUsersByAdmin() {
  const token = localStorage.getItem("jwt_token");
  if (!token) {
    throw new Error("Token otentikasi admin tidak ditemukan.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal mengambil daftar pengguna.");
    }
    
    return result.users; 
  } catch (error) {
    console.error("Error in getAllUsersByAdmin:", error);
    throw error;
  }
}

/**
 * Mengambil data pengguna dari localStorage.
 * Ini adalah cara cepat tanpa memanggil API.
 * @returns {Object|null} Objek pengguna atau null jika tidak ada.
 */
export function getUserData() {
    const userString = localStorage.getItem('user');
    if (!userString) {
        return null;
    }
    
    try {
        return JSON.parse(userString);
    } catch (e) {
        console.error("Gagal parse data user dari localStorage:", e);
        
        localStorage.removeItem('user');
        localStorage.removeItem('jwt_token');
        return null;
    }
}
