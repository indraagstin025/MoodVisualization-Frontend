import { logoutUser } from "../Services/AuthServices.js";
import { API_BASE_URL } from "../utils/constants.js";

function updateNavbarProfileInfo() {
  console.log("===================================");
  console.log("LAYOUT.JS: Memulai update info navbar...");

  const userPhotoElement = document.getElementById("navbar-user-photo");
  const userString = localStorage.getItem("user");

  if (!userPhotoElement) {
    console.error("LAYOUT.JS: GAGAL! Elemen <img id='navbar-user-photo'> tidak ditemukan di HTML.");
    return;
  }

  if (userString && userString !== "undefined") {
    const user = JSON.parse(userString);
    console.log("LAYOUT.JS: Data 'user' dari localStorage ditemukan:", user);

    const photoUrlFromAccessor = user.photo_url;
    console.log("LAYOUT.JS: Mengecek properti 'photo_url' dari data di atas. Isinya:", photoUrlFromAccessor);

    if (photoUrlFromAccessor) {
      console.log("LAYOUT.JS: SUKSES! 'photo_url' valid. Mengatur src gambar menjadi:", photoUrlFromAccessor);
      userPhotoElement.src = photoUrlFromAccessor;
    } else {
      console.log("LAYOUT.JS: INFO. 'photo_url' kosong. Gambar akan tetap menggunakan src default dari HTML.");
    }
  } else {
    console.log("LAYOUT.JS: INFO. Tidak ada data 'user' yang valid di localStorage.");
  }
  console.log("===================================");
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Skrip layout.js utama dimuat.");

  updateNavbarProfileInfo();

  const logoutButton = document.getElementById("logoutButton");
  const logoutButtonMobile = document.getElementById("logoutButtonMobile");
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const mobileMenuEl = document.getElementById("mobileMenu");

  function showLogoutConfirmation() {
    Swal.fire({
      title: "Apakah Anda yakin ingin logout?",
      text: "Anda akan keluar dari sesi ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#EF4444",
      confirmButtonText: "Ya, Logout!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        logoutUser();
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", showLogoutConfirmation);
  }

  if (logoutButtonMobile) {
    logoutButtonMobile.addEventListener("click", function () {
      if (mobileMenuEl && !mobileMenuEl.classList.contains("hidden")) {
        mobileMenuEl.classList.add("hidden");
      }
      showLogoutConfirmation();
    });
  }

  if (mobileMenuButton && mobileMenuEl) {
    mobileMenuButton.addEventListener("click", () => {
      mobileMenuEl.classList.toggle("hidden");
    });
  }

  document.querySelectorAll("nav a, #mobileMenu a").forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      if (href && href.startsWith("#") && this.hostname === window.location.hostname && this.pathname === window.location.pathname) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) {
          window.scrollTo({ top: targetElement.offsetTop - 70, behavior: "smooth" });
          if (mobileMenuEl && !mobileMenuEl.classList.contains("hidden")) {
            mobileMenuEl.classList.add("hidden");
          }
        }
      } else if (href && !href.startsWith("#")) {
        if (mobileMenuEl && !mobileMenuEl.classList.contains("hidden")) {
          mobileMenuEl.classList.add("hidden");
        }
      }
    });
  });
});
