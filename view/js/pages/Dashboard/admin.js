import { createUserByAdmin, getAllUsersByAdmin } from "../../Services/AuthServices.js";
import { createClass, getAllClasses } from "../../Services/ClassServices.js";

/**
 * Menangani submit form untuk membuat pengguna baru.
 * @param {Event} event
 */
async function handleCreateUserSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const role = form.querySelector("#newUserRole").value;

  // Siapkan data dasar
  const newUserData = {
    name: form.querySelector("#newUserName").value,
    email: form.querySelector("#newUserEmail").value,
    password: form.querySelector("#newUserPassword").value,
    role: role,
  };

  // Jika rolenya murid, tambahkan class_id ke data
  if (role === 'murid') {
    const classId = form.querySelector("#newUserClass").value;
    if (!classId) {
        Toastify({ text: "Error: Silakan pilih kelas untuk murid.", /* ... styling ... */ }).showToast();
        return;
    }
    newUserData.class_id = classId;
  }

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
  const addBtn = document.getElementById("add-class-btn");
  const classNameInput = document.getElementById("new-class-name");
  const teacherSelect = document.getElementById("new-class-teacher"); // <-- Ambil elemen select guru
  const errorP = document.getElementById("class-form-error");

  loadAndRenderClasses(); // Ini tidak berubah

  addBtn.addEventListener("click", async () => {
    const newName = classNameInput.value.trim();
    const teacherId = teacherSelect.value; // <-- Ambil ID guru yang dipilih

    if (!newName) {
      errorP.textContent = "Nama kelas tidak boleh kosong.";
      return;
    }
    errorP.textContent = "";
    addBtn.disabled = true;
    addBtn.textContent = "Menyimpan...";

    try {
      // Kirim objek yang berisi nama dan teacher_id
      await createClass({ name: newName, teacher_id: teacherId });
      classNameInput.value = "";
      teacherSelect.value = ""; // Reset dropdown guru
      await loadAndRenderClasses();
    } catch (error) {
      errorP.textContent = error.message;
    } finally {
      addBtn.disabled = false;
      addBtn.textContent = "Tambah";
    }
  });
}

// GANTI fungsi loadAndRenderClasses LAMA dengan yang BARU ini
async function loadAndRenderClasses() {
  const listUl = document.getElementById("class-list");
  listUl.innerHTML = '<li class="p-2 text-gray-500">Memuat...</li>';
  try {
    // Pastikan backend Anda mengirim data guru dengan ->with('teacher')
    const classes = await getAllClasses(); 
    listUl.innerHTML = "";
    if (classes.length === 0) {
      listUl.innerHTML = '<li class="p-2 text-gray-500">Belum ada kelas.</li>';
    }
    classes.forEach((cls) => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center p-2 bg-gray-100 rounded-md";
      // Tampilkan nama guru jika ada, jika tidak tampilkan "Belum ada"
      const teacherName = cls.teacher ? cls.teacher.name : '<span class="text-xs text-gray-400">Belum ada wali kelas</span>';
      li.innerHTML = `<span>${cls.name}</span> <span class="text-sm font-medium text-gray-600">${teacherName}</span>`;
      listUl.appendChild(li);
    });
  } catch (error) {
    listUl.innerHTML = `<li class="p-2 text-red-500">${error.message}</li>`;
  }
}

// Tambahkan fungsi baru ini di dalam admin.js
async function populateClassDropdownForAdmin() {
    const selectElement = document.getElementById('newUserClass');
    if (!selectElement) return;

    try {
        const classes = await getAllClasses();
        selectElement.innerHTML = '<option value="">-- Pilih Kelas --</option>'; // Reset
        classes.forEach(cls => {
            selectElement.innerHTML += `<option value="${cls.id}">${cls.name}</option>`;
        });
    } catch (error) {
        console.error("Gagal memuat kelas untuk form admin:", error);
    }
}

// Tambahkan fungsi baru ini di dalam admin.js
async function populateTeacherDropdown() {
    const selectElement = document.getElementById('new-class-teacher');
    if (!selectElement) return;

    try {
        const users = await getAllUsersByAdmin();
        const teachers = users.filter(user => user.role === 'pengajar');
        
        selectElement.innerHTML = '<option value="">-- Pilih Wali Kelas (Opsional) --</option>'; // Reset
        teachers.forEach(teacher => {
            selectElement.innerHTML += `<option value="${teacher.id}">${teacher.name}</option>`;
        });
    } catch (error) {
        console.error("Gagal memuat daftar guru:", error);
    }
}

/**
 * Fungsi inisialisasi untuk modul Admin.
 * Dipanggil oleh orkestrator dashboard.js.
 */
export function init() {
  console.log("Inisialisasi modul dashboard ADMIN.");

  const createUserForm = document.getElementById("createUserForm");
  const roleSelect = document.getElementById("newUserRole");
  const classContainer = document.getElementById("class-selection-container");

  if (createUserForm) {
    // 1. Isi dropdown kelas saat halaman dimuat
    populateClassDropdownForAdmin();

    // 2. Tambahkan listener untuk menampilkan/menyembunyikan dropdown kelas
    if (roleSelect && classContainer) {
        roleSelect.addEventListener('change', (e) => {
            if (e.target.value === 'murid') {
                classContainer.classList.remove('hidden');
            } else {
                classContainer.classList.add('hidden');
            }
        });
    }
    
    // 3. Setup listener untuk submit form
    createUserForm.addEventListener("submit", handleCreateUserSubmit);
  }

  // Panggil fungsi lain seperti biasa
  setupAdminUserList();
  setupClassManagement();
  populateTeacherDropdown();
}
