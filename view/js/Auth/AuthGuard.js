(function() {
    // 1. GANTI 'NILAI_KEY_TOKEN_ANDA_DISINI' dengan nilai string aktual dari JWT_TOKEN_KEY Anda.
    // Misalnya, jika di constants.js Anda JWT_TOKEN_KEY = 'moodvis_app_token', maka gunakan 'moodvis_app_token'.
    const JWT_TOKEN_KEY = 'jwt_token'; 

    const token = localStorage.getItem(JWT_TOKEN_KEY);

    // Daftar halaman yang tidak memerlukan auth guard ini (misalnya halaman login itu sendiri atau register)
    // Ini untuk mencegah redirect loop jika script ini secara tidak sengaja disertakan di halaman login.
    const publicPages = ['/view/login.html', '/view/register.html']; // Sesuaikan path jika perlu

    // Dapatkan path halaman saat ini
    const currentPage = window.location.pathname;
    
    // Cek apakah halaman saat ini adalah halaman publik
    let isPublicPage = false;
    for (let i = 0; i < publicPages.length; i++) {
        if (currentPage.endsWith(publicPages[i])) {
            isPublicPage = true;
            break;
        }
    }

    // Hanya jalankan guard jika ini bukan halaman publik dan token tidak ada
    if (!isPublicPage && !token) {
        alert('Anda harus login terlebih dahulu untuk mengakses halaman ini.');
        
        // 2. Sesuaikan path ke 'login.html'.
        // Jika authGuard.js ada di 'view/js/' dan login.html ada di 'view/', maka path-nya '../login.html'.
        // Jika authGuard.js dan login.html ada di direktori yang sama (misalnya 'view/'), maka path-nya 'login.html'.
        // Jika root proyek Anda adalah 'http://127.0.0.1:5501/' dan login.html ada di 'http://127.0.0.1:5501/view/login.html'
        // Anda bisa juga menggunakan path absolut dari root: '/view/login.html'
        window.location.href = './login.html'; // Asumsi authGuard.js di view/js/ dan login.html di view/
    }
})();