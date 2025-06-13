const API_BASE_URL = "http://localhost:8000"; // Pastikan port ini sesuai dengan server Lumen Anda

/**
 * Mengirim data registrasi pengguna ke API.
 * (Tidak ada perubahan di sini, sudah benar)
 */
export async function registerUser(name, email, password, passwordConfirmation) {
  const formData = {
    name: name,
    email: email,
    password: password,
    password_confirmation: passwordConfirmation,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });
    const result = await response.json();
    if (!response.ok) {
      let errorMessage = "Registrasi gagal.";
      if (result.message) {
        errorMessage = result.message;
      } else if (result.errors) {
        errorMessage = Object.values(result.errors).flat().join("\n");
      }
      const error = new Error(errorMessage);
      throw error;
    }
    return result;
  } catch (error) {
    console.error("Error in registerUser:", error);
    throw error;
  }
}

/**
 * Mengirim data login pengguna ke API.
 */
export async function loginUser(email, password) {
  const formData = { email, password };
  try {
    // PENYESUAIAN: URL diubah ke /api/login
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Email atau password salah.");
    }

    // PENYESUAIAN: Simpan token DAN data user ke localStorage agar konsisten
    if (result.token && result.user) {
        localStorage.setItem("jwt_token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
    }

    console.log("Login berhasil, token dan user disimpan.");
    return result;
  } catch (error) {
    console.error("Error in loginUser:", error);
    throw error;
  }
}

/**
 * Melakukan logout pengguna dengan meng-invalidate token di backend.
 */
export async function logoutUser() {
  const token = localStorage.getItem("jwt_token");
  try {
    // PENYESUAIAN: Panggil endpoint logout di backend untuk keamanan
    if (token) {
        await fetch(`${API_BASE_URL}/api/logout`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }
  } catch (error) {
    console.error("Gagal logout di server, token tetap akan dihapus di client:", error);
  } finally {
    // Apapun yang terjadi, hapus data dari client dan redirect
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }
}

/**
 * Mengambil informasi pengguna yang sedang login.
 */
export async function getLoggedInUser() {
  const token = localStorage.getItem("jwt_token");
  if (!token) throw new Error("Tidak ada token autentikasi.");

  try {
    // PENYESUAIAN: URL diubah ke /api/me
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal mengambil data pengguna.");
    return result;
  } catch (error) {
    console.error("Error in getLoggedInUser:", error);
    throw error;
  }
}

/**
 * Mengirim data pembaruan profil pengguna ke API.
 */
export async function updateUserProfile(formData) {
  const token = localStorage.getItem("jwt_token");
  if (!token) throw new Error("Tidak ada token autentikasi.");

  try {
    // PENYESUAIAN: URL diubah ke /api/profile
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
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
    // Update data user di localStorage dengan data baru dari server
    localStorage.setItem('user', JSON.stringify(result.user));
    return result;
  } catch (error) {
    console.error("Error in updateUserProfile:", error);
    throw error;
  }
}

/**
 * Membuat pengguna baru melalui endpoint admin.
 */
export async function createUserByAdmin(userData) {
  const token = localStorage.getItem("jwt_token");
  if (!token) throw new Error("Token otentikasi admin tidak ditemukan.");

  try {
    // PENYESUAIAN: URL diubah ke /api/users
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
 */
export async function getAllUsersByAdmin() {
    const token = localStorage.getItem("jwt_token");
    if (!token) throw new Error("Token otentikasi admin tidak ditemukan.");

    try {
        // --- PERBAIKAN DI SINI ---
        // URL harus mengarah ke endpoint admin yang benar
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, { // <--- UBAH URL INI!
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const result = await response.json();
        if (!response.ok) {
            // Log response status dan body untuk debugging lebih lanjut
            console.error('Failed to fetch users:', response.status, result);
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
 * (Tidak ada perubahan di sini, sudah benar)
 */
export function getUserData() {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    try {
        return JSON.parse(userString);
    } catch (e) {
        console.error("Gagal parse data user dari localStorage:", e);
        // Hapus data yang korup agar tidak menyebabkan error berulang
        localStorage.removeItem('user');
        localStorage.removeItem('jwt_token');
        return null;
    }
}