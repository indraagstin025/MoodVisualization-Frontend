// pages/dashboard/admin.js

import { createUserByAdmin, getAllUsersByAdmin } from "../../Services/AuthServices.js";
import { createClass, getAllClasses } from '../../Services/ClassServices.js';

/**
 * Menangani submit form untuk membuat pengguna baru.
 * @param {Event} event
 */
async function handleCreateUserSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const newUserData = {
    name: form.querySelector("#newUserName").value,
    email: form.querySelector("#newUserEmail").value,
    password: form.querySelector("#newUserPassword").value,
    role: form.querySelector("#newUserRole").value,
  };

  try {
    const result = await createUserByAdmin(newUserData);
    Toastify({
      text: `Sukses! Pengguna "${result.user.name}" berhasil dibuat.`,
      duration: 4000,
      gravity: "top",
      position: "center",
      style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
    }).showToast();
    form.reset();
    // Memuat ulang daftar pengguna untuk menampilkan data baru
    setupAdminUserList();
  } catch (error) {
    Toastify({
      text: `Error: ${error.message}`,
      duration: 5000,
      gravity: "top",
      position: "center",
      close: true,
      style: { background: "linear-gradient(to right, #e02828, #ff8c00)" },
    }).showToast();
  }
}

/**
 * Mengatur dan menampilkan daftar semua pengguna dengan paginasi.
 */
async function setupAdminUserList() {
  console.log("Memulai setupAdminUserList...");

  const userListBody = document.getElementById("user-list-body");
  const paginationControls = document.getElementById("pagination-controls");

  if (!userListBody) {
    console.log("Tabel admin tidak ditemukan. Proses dihentikan.");
    return;
  }

  let allUsers = [];
  const usersPerPage = 5;
  let currentPage = 1;

  function displayUsers(page) {
    currentPage = page;
    userListBody.innerHTML = "";
    const startIndex = (page - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    paginatedUsers.forEach((user, index) => {
      let roleBadge = `<span class="px-2.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">${user.role}</span>`;
      if (user.role.toLowerCase() === "pengajar") {
        roleBadge = `<span class="px-2.5 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">${user.role}</span>`;
      } else if (user.role.toLowerCase() === "murid") {
        roleBadge = `<span class="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">${user.role}</span>`;
      }

      const registrationDate = new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      const row = `
        <tr class="transition-colors duration-200 even:bg-slate-50 hover:bg-emerald-50">
            <td class="px-6 py-4 text-gray-600">${startIndex + index + 1}</td>
            <td class="px-6 py-4 font-medium text-gray-900">${user.name}</td>
            <td class="px-6 py-4 text-gray-600">${user.email}</td>
            <td class="px-6 py-4">${roleBadge}</td>
            <td class="px-6 py-4 text-gray-600">${registrationDate}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-3">
                    <button title="Edit Pengguna" class="text-sky-600 hover:text-sky-800"><svg xmlns="http:
                    <button title="Hapus Pengguna" class="text-red-600 hover:text-red-800"><svg xmlns="http:
                </div>
            </td>
        </tr>`;
      userListBody.innerHTML += row;
    });
    setupPagination();
  }

  function setupPagination() {
    if (!paginationControls) return;
    paginationControls.innerHTML = "";
    const pageCount = Math.ceil(allUsers.length / usersPerPage);
    if (pageCount <= 1) return;

    const pageInfo = document.createElement("span");
    pageInfo.className = "text-sm text-gray-700";
    pageInfo.textContent = `Halaman ${currentPage} dari ${pageCount}`;

    const navContainer = document.createElement("div");
    navContainer.className = "inline-flex -space-x-px";

    const prevButton = createNavButton("Sebelumnya", () => displayUsers(currentPage - 1));
    if (currentPage === 1) prevButton.disabled = true;

    const nextButton = createNavButton("Berikutnya", () => displayUsers(currentPage + 1));
    if (currentPage === pageCount) nextButton.disabled = true;
    
    if (prevButton.disabled) prevButton.classList.add("opacity-50", "cursor-not-allowed");
    if (nextButton.disabled) nextButton.classList.add("opacity-50", "cursor-not-allowed");

    navContainer.appendChild(prevButton);
    navContainer.appendChild(nextButton);
    paginationControls.appendChild(pageInfo);
    paginationControls.appendChild(navContainer);
  }

  function createNavButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = "px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors mx-1";
    button.addEventListener("click", onClick);
    return button;
  }

  try {
    userListBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Memuat data pengguna...</td></tr>`;
    const users = await getAllUsersByAdmin();
    allUsers = users;
    displayUsers(1);
  } catch (error) {
    console.error("Gagal saat memuat daftar pengguna:", error);
    userListBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
  }
}

function setupClassManagement() {
    const addBtn = document.getElementById('add-class-btn');
    const classNameInput = document.getElementById('new-class-name');
    const errorP = document.getElementById('class-form-error');

    // Muat daftar kelas saat halaman dibuka
    loadAndRenderClasses();

    // Event listener untuk tombol tambah
    addBtn.addEventListener('click', async () => {
        const newName = classNameInput.value.trim();
        if (!newName) {
            errorP.textContent = 'Nama kelas tidak boleh kosong.';
            return;
        }
        errorP.textContent = '';
        addBtn.disabled = true;
        addBtn.textContent = 'Menyimpan...';

        try {
            await createClass(newName);
            classNameInput.value = ''; // Kosongkan input
            await loadAndRenderClasses(); // Muat ulang daftar kelas
        } catch (error) {
            errorP.textContent = error.message;
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Tambah';
        }
    });
}

// Fungsi baru untuk memuat dan menampilkan daftar kelas
async function loadAndRenderClasses() {
    const listUl = document.getElementById('class-list');
    listUl.innerHTML = '<li class="p-2 text-gray-500">Memuat...</li>';
    try {
        const classes = await getAllClasses();
        listUl.innerHTML = '';
        if (classes.length === 0) {
            listUl.innerHTML = '<li class="p-2 text-gray-500">Belum ada kelas.</li>';
        }
        classes.forEach(cls => {
            const li = document.createElement('li');
            li.className = 'p-2 bg-gray-100 rounded-md';
            li.textContent = cls.name;
            listUl.appendChild(li);
        });
    } catch (error) {
        listUl.innerHTML = `<li class="p-2 text-red-500">${error.message}</li>`;
    }
}

/**
 * Fungsi inisialisasi untuk modul Admin.
 * Dipanggil oleh orkestrator dashboard.js.
 */
export function init() {
  console.log("Inisialisasi modul dashboard ADMIN.");
  
  const createUserForm = document.getElementById("createUserForm");
  if (createUserForm) {
    createUserForm.addEventListener("submit", handleCreateUserSubmit);
  }
  
  setupAdminUserList();
  setupClassManagement();
}