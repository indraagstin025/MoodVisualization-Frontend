// js/dashboard.js

import { logoutUser, getLoggedInUser } from './Services/AuthServices.js'; // Path sudah benar

document.addEventListener("DOMContentLoaded", async function () {
    console.log('Dashboard script dimuat.');

    // --- Fungsionalitas Nama Pengguna ---
    const welcomeHeading = document.querySelector("h1");
    if (welcomeHeading) {
        try {
            const user = await getLoggedInUser(); 
            if (user && user.username) { 
                welcomeHeading.innerHTML = welcomeHeading.innerHTML.replace("[Nama Pengguna]", user.username);
            } else {
                welcomeHeading.innerHTML = welcomeHeading.innerHTML.replace("[Nama Pengguna]", "Pengguna MoodVis"); 
            }
        } catch (error) {
            console.error('Gagal mengambil data pengguna:', error);
            welcomeHeading.innerHTML = welcomeHeading.innerHTML.replace("[Nama Pengguna]", "Pengguna MoodVis"); 
            if (error.statusCode === 401 || error.message === 'Tidak ada token autentikasi.') {
                 alert('Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.');
                 logoutUser(); 
            }
        }
    }

    // --- Fungsionalitas Tombol Logout ---
    const logoutButton = document.getElementById("logoutButton");
    const logoutButtonMobile = document.getElementById("logoutButtonMobile");

    // Fungsi untuk menampilkan konfirmasi logout dengan SweetAlert2
    function showLogoutConfirmation() {
        Swal.fire({
            title: 'Apakah Anda yakin ingin logout?',
            text: "Anda akan keluar dari sesi ini.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10B981', // Hijau (Tailwind green-500)
            cancelButtonColor: '#EF4444', // Merah (Tailwind red-500)
            confirmButtonText: 'Ya, Logout!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                console.log('Pengguna mengkonfirmasi logout.');
                logoutUser(); // Panggil fungsi logout jika pengguna mengklik 'Ya, Logout!'
            } else {
                console.log('Pengguna membatalkan logout.');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener("click", function() {
            console.log('Tombol Logout diklik (Desktop).');
            showLogoutConfirmation(); // Panggil fungsi konfirmasi SweetAlert
        });
    }
    if (logoutButtonMobile) {
        logoutButtonMobile.addEventListener("click", function() {
            console.log('Tombol Logout Mobile diklik.');
            const mobileMenu = document.getElementById("mobileMenu"); 
            if (mobileMenu) mobileMenu.classList.add('hidden'); // Tutup menu mobile jika terbuka
            showLogoutConfirmation(); // Panggil fungsi konfirmasi SweetAlert
        });
    }
});


// --- BAGIAN NAVIGASI & MOBILE MENU ---
document.querySelectorAll('nav a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      window.scrollTo({ top: targetElement.offsetTop - 70, behavior: "smooth" });
      const mobileMenu = document.getElementById("mobileMenu");
      if (!mobileMenu.classList.contains("hidden")) {
        mobileMenu.classList.add("hidden");
      }
    }
  });
});
const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileMenu = document.getElementById("mobileMenu");
mobileMenuButton.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
});
const ctaButtonMobile = document.getElementById("ctaButtonMobile");
if (ctaButtonMobile) {
  ctaButtonMobile.addEventListener("click", function () {
    alert('Anda mengklik tombol "Coba Gratis" (Mobile)! Arahkan ke halaman pendaftaran atau fitur utama.');
    mobileMenu.classList.add("hidden");
  });
}