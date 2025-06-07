import { registerUser } from "../Services/AuthServices.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Register script dimuat.");

  const registrationForm = document.getElementById("registrationForm");

  if (registrationForm) {
    console.log("Formulir registrasi ditemukan.");
    registrationForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      console.log("Form disubmit!");

      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const password_confirmation = document.getElementById("password_confirmation").value;

      console.log("Data form:", { username, email, password, password_confirmation });

      try {
        console.log("Memanggil registerUser...");
        const result = await registerUser(username, email, password, password_confirmation);

        console.log("Registrasi Berhasil:", result);
        alert("Registrasi berhasil! Silakan login.");
        window.location.href = "login.html";
      } catch (error) {
        console.error("Terjadi kesalahan saat registrasi:", error);
        alert("Error: " + error.message);
      }
    });
  } else {
    console.warn('Elemen formulir dengan ID "registrationForm" tidak ditemukan.');
  }
});
