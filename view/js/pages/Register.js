// file Register.js Anda

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
      
      // Hapus baris ini, karena role tidak lagi dikirim dari frontend
      // const role = "murid"; 

      try {
        // Panggil fungsi tanpa menyertakan 'role'
        const result = await registerUser(name, email, password, password_confirmation);

        // Bagian ini sudah benar, tidak perlu diubah.
        Toastify({
          text: "Registrasi berhasil! Anda akan diarahkan...",
          duration: 3000, // Tambahkan durasi agar tidak langsung hilang
          gravity: "top",
          position: "center",
          backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
          callback: () => {
            window.location.href = "login.html";
          },
        }).showToast();

      } catch (error) {
        // Blok catch ini juga sudah benar.
        // `error.message` akan berisi pesan yang sudah diformat dengan baik oleh AuthServices.js
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