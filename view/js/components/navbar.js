document.addEventListener("DOMContentLoaded", () => {
    // 1. Ambil data pengguna dari localStorage, sama seperti di profile.js
    const userString = localStorage.getItem("user");

    // Jika tidak ada data pengguna, hentikan eksekusi untuk menghindari error
    if (!userString || userString === "undefined") {
        console.warn("Data pengguna tidak ditemukan. Modal profil tidak akan aktif.");
        // Anda bisa tambahkan redirect ke halaman login di sini jika perlu
        // window.location.href = '/login.html'; 
        return; 
    }

    const user = JSON.parse(userString);

    // 2. Panggil fungsi untuk mengisi data di navbar & mengatur modal
    populateNavbar(user);
    setupProfileModal(user);
});

/**
 * Mengisi data pengguna (foto, nama) ke elemen-elemen di navbar.
 * @param {object} user - Objek pengguna dengan properti name, email, photo_url.
 */
function populateNavbar(user) {
    const defaultAvatar = "/public/img/default-avatar.jpg";

    // Foto di navbar desktop
    const navbarPhoto = document.getElementById('navbar-user-photo');
    if (navbarPhoto) {
        navbarPhoto.src = user.photo_url || defaultAvatar;
        navbarPhoto.alt = `Foto profil ${user.name}`;
    }

    // Info di menu mobile
    const mobileNavbarPhoto = document.getElementById('mobile-navbar-user-photo');
    const mobileNavbarName = document.getElementById('mobile-navbar-user-name');
    if (mobileNavbarPhoto) {
        mobileNavbarPhoto.src = user.photo_url || defaultAvatar;
    }
    if (mobileNavbarName) {
        mobileNavbarName.innerText = user.name;
    }
}

/**
 * Mengatur semua fungsionalitas untuk modal profil.
 * @param {object} user - Objek pengguna dengan properti name, email, photo_url.
 */
function setupProfileModal(user) {
    const trigger = document.getElementById('profileModalTrigger');
    const modal = document.getElementById('profileModal');
    const modalContent = document.getElementById('profileModalContent');
    const closeModalBtn = document.getElementById('closeProfileModal');
    
    // Pastikan semua elemen ada sebelum menambahkan event listener
    if (!trigger || !modal || !closeModalBtn || !modalContent) {
        console.error("Elemen penting untuk modal tidak ditemukan di HTML.");
        return;
    }
    
    // Elemen di dalam modal yang akan diisi data
    const modalUserPhoto = document.getElementById('modal-user-photo');
    const modalUserName = document.getElementById('modal-user-name');
    const modalUserEmail = document.getElementById('modal-user-email');

    const openModal = () => {
        // Isi data pengguna ke dalam modal setiap kali dibuka
        if (modalUserPhoto) modalUserPhoto.src = user.photo_url || "/public/img/default-avatar.jpg";
        if (modalUserName) modalUserName.innerText = user.name;
        if (modalUserEmail) modalUserEmail.innerText = user.email;

        modal.classList.remove('hidden');
        setTimeout(() => { // Delay untuk animasi
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    };

    const closeModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 200); // Sinkronkan dengan durasi transisi
    };

    // Tambahkan event listener untuk membuka dan menutup modal
    trigger.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal(); // Tutup jika klik di luar konten
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });
}