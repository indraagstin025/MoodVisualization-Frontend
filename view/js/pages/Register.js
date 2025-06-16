import { registerUser } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", () => {
  const registrationForm = document.getElementById("registrationForm");
  if (registrationForm) {
    registrationForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const password_confirmation = document.getElementById("password_confirmation").value;

      try {
        const result = await registerUser(name, email, password, password_confirmation);

        Toastify({
          text: "Registrasi berhasil! Anda akan diarahkan...",
          duration: 3000,
          gravity: "top",
          position: "center",
          backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
          callback: () => {
            window.location.href = "login.html";
          },
        }).showToast();
      } catch (error) {
        Toastify({
          text: `Error: ${error.message}`,
          duration: 5000,
          gravity: "top",
          position: "center",
          backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
      }
    });
  }
});
