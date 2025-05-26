// js/Auth/Login.js (Setelah Perbaikan)

import { loginUser } from '../Services/AuthServices.js'; // Pastikan path benar

document.addEventListener("DOMContentLoaded", () => {
    console.log('Login script dimuat.');

    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        console.log('Formulir login ditemukan.');
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            console.log('Form login disubmit!');

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            console.log('Data login yang dikirim:', { email, password });

            try {
                console.log('Memanggil loginUser dari AuthServices...');
                const result = await loginUser(email, password); 
                
                // --- BAGIAN PENTING: SIMPAN TOKEN DI LOCAL STORAGE DI SINI ---
                console.log('Respons lengkap dari loginUser di Login.js:', result); // LOG INI SANGAT PENTING

                if (result && result.token) { // Asumsi properti 'token' ada di objek 'result'
                    localStorage.setItem('jwt_token', result.token);
                    console.log('Token JWT berhasil disimpan di Local Storage:', result.token);
                    alert('Login berhasil! Selamat datang!');
                    window.location.href = 'dashboard.html';
                } else {
                    console.warn('Login berhasil, tetapi properti "token" tidak ditemukan dalam respons:', result);
                    alert('Login berhasil, namun gagal mendapatkan token. Silakan coba lagi.');
                    // Jika token tidak ada, jangan lanjutkan ke dashboard
                    // return;
                }
                // -----------------------------------------------------------

            } catch (error) {
                console.error('Terjadi kesalahan saat login (Login.js catch block):', error);
                alert('Error: ' + error.message);
            }
        });
    } else {
        console.warn('Elemen formulir dengan ID "loginForm" tidak ditemukan.');
    }
});