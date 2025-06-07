import { logoutUser } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("Skrip UI Umum dimuat.");

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
      const isLogoutButtonInsideMenu = this.id === "logoutButtonMobile";

      if (isLogoutButtonInsideMenu) {
        return;
      }

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
