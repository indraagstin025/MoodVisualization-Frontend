(function () {
  const JWT_TOKEN_KEY = "jwt_token";

  const token = localStorage.getItem(JWT_TOKEN_KEY);

  const publicPages = ["/view/login.html", "/view/register.html"];

  const currentPage = window.location.pathname;

  let isPublicPage = false;
  for (let i = 0; i < publicPages.length; i++) {
    if (currentPage.endsWith(publicPages[i])) {
      isPublicPage = true;
      break;
    }
  }

  if (!isPublicPage && !token) {
    alert("Anda harus login terlebih dahulu untuk mengakses halaman ini.");

    window.location.href = "./login.html";
  }
})();
