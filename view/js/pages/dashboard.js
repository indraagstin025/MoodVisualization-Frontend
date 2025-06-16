import { getUserData, logoutUser } from "../Services/AuthServices.js";
import { capitalizeFirstLetter } from "../utils/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.pathname.includes("dashboard.html")) return;

  console.log("Memulai skrip dashboard orkestrator...");

  const user = getUserData();

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

  initializeDashboard(user);
});

/**
 * Fungsi master yang mengorkestrasi seluruh penyiapan dashboard.
 * @param {Object} user - Objek pengguna dari localStorage.
 */
async function initializeDashboard(user) {
  console.log(`Menginisialisasi dashboard untuk: ${user.name} (Role: ${user.role})`);

  const welcomeHeading = document.getElementById("mainWelcomeHeading");
  if (welcomeHeading) {
    welcomeHeading.textContent = `Selamat Datang, ${capitalizeFirstLetter(user.role)} ${user.name}!`;
  }

  await loadRoleContent(user.role);

  await initializeRoleSpecificScripts(user.role);
}

async function loadRoleContent(role) {
  const container = document.getElementById("dashboard-content-container");
  if (!container) {
    console.error("Wadah #dashboard-content-container tidak ditemukan!");
    return;
  }

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

    switch (role) {
      case "admin":
        roleModule = await import("./Dashboard/admin.js");
        break;
      case "pengajar":
        roleModule = await import("./Dashboard/teacher.js");
        break;
      case "murid":
      default:
        roleModule = await import("./Dashboard/student.js");
        break;
    }

    if (roleModule && typeof roleModule.init === "function") {
      console.log(`Modul untuk role '${role}' berhasil dimuat, menjalankan init()...`);
      roleModule.init();
    } else {
      console.warn(`Modul untuk role '${role}' tidak memiliki fungsi init().`);
    }
  } catch (error) {
    console.error(`Gagal memuat atau menjalankan modul untuk role '${role}':`, error);
  }
}
