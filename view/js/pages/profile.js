import { getLoggedInUser, updateUserProfile } from "../Services/AuthServices.js";
import { API_BASE_URL } from "../utils/constants.js";

document.addEventListener("DOMContentLoaded", () => {
  populateProfileData();
  setupImagePreview();
  setupProfileFormSubmit();
});


async function populateProfileData() {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  const profileImagePreview = document.getElementById("profileImagePreview");
  console.log("DEBUG: Mencari elemen <img id='profileImagePreview'>...", profileImagePreview);

  if (!profileImagePreview || !nameInput || !emailInput) {
    console.error("Salah satu elemen profil tidak ditemukan di HTML.");
    return;
  }

  const userString = localStorage.getItem("user");
  if (userString && userString !== "undefined") {
    const user = JSON.parse(userString);
    nameInput.value = user.name;
    emailInput.value = user.email;

    if (user.photo_url) {
      profileImagePreview.src = user.photo_url;
    } else {
      profileImagePreview.src = "public/img/default-avatar.png";
    }
  } else {
    console.error("Tidak ada data pengguna di localStorage.");
  }
}

/**
 * Mengatur listener untuk pratinjau gambar saat file dipilih.
 */
function setupImagePreview() {
  const photoInput = document.getElementById("photo");
  const profileImagePreview = document.getElementById("profileImagePreview");
  if (photoInput && profileImagePreview) {
    photoInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          profileImagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Mengatur listener untuk submit form profil.
 */
function setupProfileFormSubmit() {
  const profileForm = document.getElementById("profileForm");
  if (!profileForm) return;

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = profileForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http:
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menyimpan...
        `;

    try {
      const formData = new FormData(profileForm);
      formData.append("_method", "PUT");

      const result = await updateUserProfile(formData);

      Toastify({
        text: result.message || "Profil berhasil diperbarui!",
        duration: 3000,
        gravity: "top",
        position: "center",
        style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
      }).showToast();
    } catch (error) {
      Toastify({
        text: `Error: ${error.message}`,
        duration: 5000,
        gravity: "top",
        position: "center",
        close: true,
        style: { background: "linear-gradient(to right, #ef4444, #ff8c00)" },
      }).showToast();
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const photoInput = document.getElementById("photo");
  const profileImagePreview = document.getElementById("profileImagePreview");

  if (photoInput && profileImagePreview) {
    photoInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          profileImagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
});


