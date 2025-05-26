// js/authServices.js

const API_BASE_URL = 'http://localhost:8000'; // Sesuaikan dengan URL backend Lumen Anda

/**
 * Mengirim data registrasi pengguna ke API.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Respons dari API
 * @throws {Error} Jika terjadi kesalahan jaringan atau respons API tidak berhasil.
 */
export async function registerUser(username, email, password, passwordConfirmation) { // Tambahkan parameter ini
    const formData = {
        username: username,
        email: email,
        password: password,
        password_confirmation: passwordConfirmation, // Tambahkan ini
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
            let errorMessage = 'Registrasi gagal. Mohon coba lagi.';
            if (result.message) {
                errorMessage = result.message;
            } else if (result.errors) {
                errorMessage = Object.values(result.errors).flat().join('\n');
            }
            const error = new Error(errorMessage);
            error.statusCode = response.status;
            throw error;
        }

        return result;
    } catch (error) {
        console.error('Error in registerUser:', error);
        throw error;
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
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (!response.ok) {
            let errorMessage = 'Login gagal. Email atau password salah.';
            if (result.message) { errorMessage = result.message; }
            const error = new Error(errorMessage);
            error.statusCode = response.status;
            throw error;
        }

        // HAPUS BAGIAN INI DARI AUTHSERVICES.JS
        /*
        if (result.token) {
            localStorage.setItem('jwt_token', result.token);
            console.log('Token disimpan di AuthServices (internal):', result.token);
        } else {
            console.warn('Login berhasil, tetapi properti "token" tidak ditemukan di respons dari API:', result);
        }
        */

        console.log('Data yang dikembalikan dari API login di AuthServices:', result); // Log ini penting
        return result; // Pastikan ini mengembalikan objek penuh dari API
    } catch (error) {
        console.error('Error in loginUser (AuthServices):', error);
        throw error;
    }
}

/**
 * Melakukan logout pengguna.
 * @returns {void}
 */
export function logoutUser() {
    localStorage.removeItem('jwt_token');
    // localStorage.removeItem('user_info'); // Hapus juga user info jika disimpan
    // Redirect ke halaman login atau home setelah logout
    window.location.href = 'login.html'; // Contoh redirect
}

/**
 * Mengambil informasi pengguna yang sedang login.
 * @returns {Promise<Object>} Data pengguna.
 * @throws {Error} Jika tidak ada token atau request gagal.
 */
export async function getLoggedInUser() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        throw new Error('Tidak ada token autentikasi.');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/me`, { // Endpoint /me
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}` // Sertakan token di header
            },
        });

        const result = await response.json();

        if (!response.ok) {
            let errorMessage = 'Gagal mengambil data pengguna.';
            if (result.message) {
                errorMessage = result.message;
            }
            const error = new Error(errorMessage);
            error.statusCode = response.status;
            throw error;
        }

        return result;
    } catch (error) {
        console.error('Error in getLoggedInUser:', error);
        throw error;
    }
}