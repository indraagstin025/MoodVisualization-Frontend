// js/Auth/Login.js

import { loginUser } from '../Services/AuthServices.js'; // Pastikan path benar

document.addEventListener("DOMContentLoaded", () => {
    console.log('Login script dimuat.');

    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        console.log('Formulir login ditemukan.');
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Mencegah refresh halaman default

            console.log('Form login disubmit!');

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            console.log('Data login yang dikirim:', { email, password });

            try {
                console.log('Memanggil loginUser dari AuthServices...');
                const result = await loginUser(email, password); 
                
                // --- BAGIAN PENTING: SIMPAN TOKEN DI LOCAL STORAGE DI SINI ---
                console.log('Respons lengkap dari loginUser di Login.js:', result); 

                if (result && result.token) { 
                    localStorage.setItem('jwt_token', result.token);
                    console.log('Token JWT berhasil disimpan di Local Storage:', result.token);
                    
                    // Notifikasi Sukses dengan Toastify-JS
                    Toastify({
                        text: "Login berhasil! Selamat datang!",
                        duration: 3000, // Durasi tampil (3 detik)
                        newWindow: true,
                        close: false, 
                        gravity: "top", 
                        position: "center", 
                        stopOnFocus: true, 
                        style: {
                            background: "linear-gradient(to right, #00b09b, #96c93d)", // Warna hijau
                        },
                        callback: function() { 
                            // Redirect ke dashboard setelah notifikasi hilang
                            window.location.href = 'dashboard.html';
                        }
                    }).showToast();

                } else {
                    console.warn('Login berhasil, tetapi properti "token" tidak ditemukan dalam respons:', result);
                    // Notifikasi jika login berhasil tetapi token tidak ada (situasi tidak biasa)
                    Toastify({
                        text: "Login berhasil, namun gagal mendapatkan token. Silakan coba lagi.",
                        duration: 4000, 
                        newWindow: true,
                        close: true, 
                        gravity: "top", 
                        position: "center", 
                        stopOnFocus: true, 
                        style: {
                            background: "linear-gradient(to right, #ff5f6d, #ffc371)", // Warna oranye/merah
                        },
                    }).showToast();
                }

            } catch (error) {
                console.error('Terjadi kesalahan saat login (Login.js catch block):', error);
                
                let errorMessage = 'Terjadi kesalahan tidak terduga saat login.'; 

                // Periksa apakah error memiliki respons dari server
                // Ini penting jika AuthServices menggunakan fetch API yang melempar error kustom
                if (error.response && error.response.data && error.response.data.message) {
                    const serverMessage = error.response.data.message.toLowerCase();

                    if (serverMessage.includes('email tidak terdaftar')) {
                        errorMessage = 'Email tidak terdaftar.';
                    } else if (serverMessage.includes('password salah')) {
                        errorMessage = 'Password salah.';
                    } else if (serverMessage.includes('gagal membuat token autentikasi')) {
                        errorMessage = 'Terjadi masalah teknis di server, silakan coba beberapa saat lagi.'; 
                    } else {
                        // Jika ada pesan error lain dari backend yang tidak spesifik
                        errorMessage = error.response.data.message; 
                    }
                } else if (error.message) {
                    // Ini menangani error dari `throw new Error()` atau error jaringan
                    errorMessage = error.message;
                }

                // Notifikasi Gagal Login
                Toastify({
                    text: errorMessage, 
                    duration: 5000, // Durasi lebih lama untuk error
                    newWindow: true,
                    close: true, // Ada tombol close agar user bisa menutup manual
                    gravity: "top", 
                    position: "center", 
                    stopOnFocus: true, 
                    style: {
                        background: "linear-gradient(to right, #e02828, #ff8c00)", // Warna merah
                    },
                }).showToast();
            }
        });
    } else {
        console.warn('Elemen formulir dengan ID "loginForm" tidak ditemukan.');
    }
});