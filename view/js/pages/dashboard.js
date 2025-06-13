/**
 * =================================================================
 * FILE ORKESTRATOR UTAMA UNTUK DASHBOARD (dashboard.js)
 * =================================================================
 * Tugas file ini HANYA untuk mengatur alur kerja utama:
 * 1. Cek sesi pengguna.
 * 2. Muat konten HTML parsial berdasarkan role.
 * 3. Muat modul JavaScript yang sesuai untuk menjalankan logika spesifik.
 *
 * TIDAK ADA LOGIKA SPESIFIK ROLE (ADMIN/PENGAJAR/MURID) DI SINI.
 * =================================================================
 */

import { getUserData, logoutUser } from "../Services/AuthServices.js";
import { capitalizeFirstLetter } from "../utils/utils.js";

// Event listener utama yang berjalan saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  // Hanya jalankan skrip jika kita berada di halaman dashboard.html
  if (!window.location.pathname.includes("dashboard.html")) return;
  
  console.log("Memulai skrip dashboard orkestrator...");

  const user = getUserData();

  // Jika tidak ada data pengguna, paksa kembali ke halaman login
  if (!user) {
    Swal.fire({
      title: "Sesi Tidak Ditemukan",
      text: "Anda harus login terlebih dahulu untuk mengakses dashboard.",
      icon: "warning",
      confirmButtonText: "Login Sekarang",
      allowOutsideClick: false,
    }).then(() => logoutUser());
    return;
  }

  // Jika ada pengguna, mulai proses inisialisasi dashboard
  initializeDashboard(user);
});

/**
 * Fungsi master yang mengorkestrasi seluruh penyiapan dashboard.
 * @param {Object} user - Objek pengguna dari localStorage.
 */
async function initializeDashboard(user) {
  console.log(`Menginisialisasi dashboard untuk: ${user.name} (Role: ${user.role})`);

  // 1. Atur sapaan selamat datang
  const welcomeHeading = document.getElementById("mainWelcomeHeading");
  if (welcomeHeading) {
    welcomeHeading.textContent = `Selamat Datang, ${capitalizeFirstLetter(user.role)} ${user.name}!`;
  }

  // 2. Muat konten HTML yang sesuai dengan role
  await loadRoleContent(user.role);

  // 3. Panggil skrip spesifik untuk role tersebut
  await initializeRoleSpecificScripts(user.role);
}

// Di dalam file pages/dashboard.js

// Di dalam file: pages/dashboard.js

async function loadRoleContent(role) {
  const container = document.getElementById("dashboard-content-container");
  if (!container) {
    console.error("Wadah #dashboard-content-container tidak ditemukan!");
    return;
  }

  // UBAH BARIS INI untuk menunjuk ke folder yang benar
  const filePath = `partials/_${role}_dashboard.html`;

  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`Gagal memuat file: ${filePath}`);

    container.innerHTML = await response.text();
    console.log(`Konten untuk role '${role}' berhasil dimuat dari ${filePath}.`);
  } catch (error) {
    console.error("Error saat memuat konten role:", error);
    container.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg">Error: Gagal memuat konten. Cek path file di dashboard.js.</div>`;
  }
}

/**
 * Mengimpor dan menjalankan modul JS spesifik secara dinamis berdasarkan role.
 * Ini adalah inti dari refactoring.
 * @param {string} role
 */
async function initializeRoleSpecificScripts(role) {
  console.log(`Mencoba memuat modul skrip untuk role: ${role}`);

  try {
    let roleModule;
    
    // Menggunakan dynamic import untuk memuat file JS yang relevan saja
    switch (role) {
      case "admin":
        roleModule = await import('./Dashboard/admin.js');
        break;
      case "pengajar":
        roleModule = await import('./Dashboard/teacher.js');
        break;
      case "murid":
      default:
        roleModule = await import('./Dashboard/student.js');
        break;
    }

    // Setelah modul berhasil diimpor, jalankan fungsi 'init' di dalamnya
    if (roleModule && typeof roleModule.init === 'function') {
      console.log(`Modul untuk role '${role}' berhasil dimuat, menjalankan init()...`);
      roleModule.init();
    } else {
        console.warn(`Modul untuk role '${role}' tidak memiliki fungsi init().`);
    }
  } catch (error) {
    console.error(`Gagal memuat atau menjalankan modul untuk role '${role}':`, error);
  }
}