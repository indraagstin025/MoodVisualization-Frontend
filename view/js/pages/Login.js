import { loginUser } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Login script dimuat.");

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    console.log("Formulir login ditemukan.");
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      console.log("Form login disubmit!");

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      console.log("Data login yang dikirim:", { email, password });

      try {
        console.log("Memanggil loginUser dari AuthServices...");
        const result = await loginUser(email, password);
        console.log("Respons lengkap dari loginUser di Login.js:", result);

        if (result && result.token && result.user) {
          // Simpan token DAN data user
          localStorage.setItem("jwt_token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));

          console.log("Token JWT berhasil disimpan:", result.token);
          console.log("Data user berhasil disimpan:", result.user);

          Toastify({
            text: `Login berhasil! Selamat datang, ${result.user.name}!`,
            duration: 3000,
            newWindow: true,
            close: false,
            gravity: "top",
            position: "center",
            stopOnFocus: true,
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
            callback: function () {
              window.location.href = "dashboard.html";
            },
          }).showToast();
        } else {
          console.warn('Login berhasil, tetapi properti "token" atau "user" tidak ditemukan dalam respons:', result);
          Toastify({
            text: "Terjadi kesalahan pada data respons dari server. Silakan coba lagi.",
            duration: 4000,
            gravity: "top",
            position: "center",
            style: { background: "linear-gradient(to right, #e02828, #ff8c00)" },
          }).showToast();
        }
      } catch (error) {
        console.error("Terjadi kesalahan saat login (Login.js catch block):", error);
        let errorMessage = "Terjadi kesalahan tidak terduga saat login.";
        if (error.message) {
          errorMessage = error.message;
        }

        Toastify({
          text: errorMessage,
          duration: 5000,
          newWindow: true,
          close: true,
          gravity: "top",
          position: "center",
          stopOnFocus: true,
          style: {
            background: "linear-gradient(to right, #e02828, #ff8c00)",
          },
        }).showToast();
      }
    });
  } else {
    console.warn('Elemen formulir dengan ID "loginForm" tidak ditemukan.');
  }
});