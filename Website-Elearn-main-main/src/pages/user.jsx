import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/dashboardlayout";
import { navigationItems } from "../navigation/navigation";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/apiUtils";
import {
  UserPlus,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  Shield,
  BookOpen,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function UserPage() {
  const [activeNav, setActiveNav] = useState("User"); // Match the ID in navigation.js
  const [activeTab, setActiveTab] = useState("Semua");
  const [users, setUsers] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [isLoading, setIsLoading] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [showTokenWarning, setShowTokenWarning] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    id_user: null,
    nama: "",
    username: "",
    email: "",
    role: "mahasiswa",
    nip: "",
    nim: "",
    id_kelas: null,
    password: "",
  });

  // Role mapping: Frontend (display) ↔ Backend (API)
  const roleMap = {
    frontend: {
      admin: "Admin",
      super_admin: "Super Admin",
      mahasiswa: "Mahasiswa",
    },
    backend: {
      Admin: "admin",
      "Super Admin": "super_admin",
      Mahasiswa: "mahasiswa",
    },
  };

  // Get logged in user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setLoggedUser(user);
    }
  }, []);

  // Check token expiration and show warning 5 minutes before expiry
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Decode JWT token (simple base64 decode for payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;
        
        // Show warning if less than 5 minutes (300000 ms) until expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry < 300000) {
          setShowTokenWarning(true);
        } else {
          setShowTokenWarning(false);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };

    // Check immediately
    checkTokenExpiration();
    
    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch users and kelas from API on component mount
  useEffect(() => {
    fetchUsers();
    fetchKelas();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await apiGet("/users/");
      // Transform backend data to frontend format
      const transformedUsers = data.map((user) => ({
        id_user: user.id_user,
        nama: user.nama || user.nama_dosen || "",
        username: user.username,
        email: user.email,
        role: roleMap.frontend[user.role] || user.role,
        nip: user.nip || "-",
        nim: user.nim || "-",
        kelas: user.nama_kelas || "-",
        id_kelas: user.id_kelas || null,
      }));
      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      showNotification('error', "Gagal memuat data pengguna: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKelas = async () => {
    try {
      const data = await apiGet("/kelas/");
      setKelasList(data);
    } catch (error) {
      console.error("Error fetching kelas:", error);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Filter users berdasarkan tab aktif
  const filteredUsers =
    activeTab === "Semua"
      ? users
      : users.filter((user) => user.role === activeTab);

  // Fungsi modal
  const openAddModal = () => {
    setFormMode("add");
    const defaultRole = activeTab === "Semua" ? "Mahasiswa" : activeTab;
    setCurrentUser({
      id_user: null,
      nama: "",
      username: "",
      email: "",
      role: roleMap.backend[defaultRole] || "mahasiswa",
      nip: "",
      nim: "",
      id_kelas: null,
      password: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setFormMode("edit");
    setCurrentUser({
      ...user,
      role: roleMap.backend[user.role] || user.role,
      password: "", // Don't prefill password for security
      nip: user.nip === "-" ? "" : user.nip,
      nim: user.nim === "-" ? "" : user.nim,
      id_kelas: user.id_kelas || null,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id, nama) => {
    setDeleteTarget({ id, nama });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsLoading(true);
      await apiDelete(`/users/${deleteTarget.id}`);
      await fetchUsers(); // Refresh list
      showNotification('success', "Pengguna berhasil dihapus");
    } catch (error) {
      console.error("Error deleting user:", error);
      showNotification('error', "Gagal menghapus pengguna: " + error.message);
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formMode === "add") {
        // Validation: Check required fields
        if (!currentUser.nama.trim()) {
          showNotification('error', "Nama lengkap wajib diisi");
          setIsLoading(false);
          return;
        }
        if (!currentUser.username.trim()) {
          showNotification('error', "Username wajib diisi");
          setIsLoading(false);
          return;
        }
        if (!currentUser.email.trim()) {
          showNotification('error', "Email wajib diisi");
          setIsLoading(false);
          return;
        }
        if (!currentUser.password.trim()) {
          showNotification('error', "Password wajib diisi");
          setIsLoading(false);
          return;
        }
        
        // Role-specific validation
        if (currentUser.role === "admin" || currentUser.role === "super_admin") {
          if (!currentUser.nip.trim()) {
            showNotification('error', "NIP wajib diisi untuk role Admin/Super Admin");
            setIsLoading(false);
            return;
          }
        }
        
        if (currentUser.role === "mahasiswa") {
          if (!currentUser.nim.trim()) {
            showNotification('error', "NIM wajib diisi untuk role Mahasiswa");
            setIsLoading(false);
            return;
          }
          if (!currentUser.id_kelas) {
            showNotification('error', "Kelas wajib dipilih untuk role Mahasiswa");
            setIsLoading(false);
            return;
          }
        }
        
        // Validation: Check if trying to create super_admin when not logged as super_admin
        if (currentUser.role === "super_admin" && loggedUser?.role !== "super_admin") {
          showNotification('error', "Hanya Super Admin yang dapat membuat akun Super Admin baru");
          setIsLoading(false);
          return;
        }

        // Create new user - different endpoints based on role
        if (currentUser.role === "admin") {
          // Create dosen with full profile
          const dosenData = {
            username: currentUser.username,
            email: currentUser.email,
            password: currentUser.password,
            nip: currentUser.nip || "",
            nama_dosen: currentUser.nama,
            email_dosen: currentUser.email,
            tempat_lahir: "",
            tanggal_lahir: "2000-01-01",
            jenis_kelamin: "L",
            agama: "",
            alamat: "",
            no_hp: ""
          };
          await apiPost("/users/dosen", dosenData);
        } else if (currentUser.role === "mahasiswa") {
          // Create mahasiswa with full profile
          const mahasiswaData = {
            username: currentUser.username,
            email: currentUser.email,
            password: currentUser.password,
            nim: currentUser.nim || "",
            nama: currentUser.nama,
            id_kelas: currentUser.id_kelas || null,
            tempat_lahir: "",
            tanggal_lahir: "2000-01-01",
            jenis_kelamin: "L",
            agama: "",
            alamat: "",
            no_hp: ""
          };
          await apiPost("/users/mahasiswa", mahasiswaData);
        } else {
          // For super_admin or other roles (fallback)
          showNotification('error', "Role super_admin tidak dapat dibuat dari form ini");
          return;
        }
        showNotification('success', "Pengguna berhasil ditambahkan");
      } else {
        // Validation for edit mode
        if (!currentUser.nama.trim()) {
          showNotification('error', "Nama lengkap wajib diisi");
          setIsLoading(false);
          return;
        }
        if (!currentUser.username.trim()) {
          showNotification('error', "Username wajib diisi");
          setIsLoading(false);
          return;
        }
        if (!currentUser.email.trim()) {
          showNotification('error', "Email wajib diisi");
          setIsLoading(false);
          return;
        }
        
        // Role-specific validation for edit
        if (currentUser.role === "admin" || currentUser.role === "super_admin") {
          if (!currentUser.nip.trim()) {
            showNotification('error', "NIP wajib diisi untuk role Admin/Super Admin");
            setIsLoading(false);
            return;
          }
        }
        
        if (currentUser.role === "mahasiswa") {
          if (!currentUser.nim.trim()) {
            showNotification('error', "NIM wajib diisi untuk role Mahasiswa");
            setIsLoading(false);
            return;
          }
          if (!currentUser.id_kelas) {
            showNotification('error', "Kelas wajib dipilih untuk role Mahasiswa");
            setIsLoading(false);
            return;
          }
        }
        
        // Update existing user
        if (currentUser.role === "admin") {
          // Update dosen
          const updateData = {
            username: currentUser.username,
            email: currentUser.email,
            nip: currentUser.nip,
            nama_dosen: currentUser.nama,
            email_dosen: currentUser.email
          };
          if (currentUser.password) {
            updateData.password = currentUser.password;
          }
          await apiPut(`/users/dosen/${currentUser.id_user}`, updateData);
        } else if (currentUser.role === "mahasiswa") {
          // Update mahasiswa
          const updateData = {
            username: currentUser.username,
            email: currentUser.email,
            nim: currentUser.nim,
            nama: currentUser.nama,
            id_kelas: currentUser.id_kelas || null
          };
          if (currentUser.password) {
            updateData.password = currentUser.password;
          }
          await apiPut(`/users/mahasiswa/${currentUser.id_user}`, updateData);
        }
        showNotification('success', "Pengguna berhasil diperbarui");
      }

      setIsModalOpen(false);
      await fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Error saving user:", error);
      showNotification('error', "Gagal menyimpan pengguna: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Hitung jumlah user per role
  const countByRole = (role) => users.filter((u) => u.role === role).length;

  const tabs = [
    { name: "Semua", icon: Users, count: users.length },
    { name: "Super Admin", icon: Shield, count: countByRole("Super Admin") },
    { name: "Admin", icon: BookOpen, count: countByRole("Admin") },
    { name: "Mahasiswa", icon: GraduationCap, count: countByRole("Mahasiswa") },
  ];

  return (
    <DashboardLayout
      navigationItems={navigationItems}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
    >
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {notification.type === 'success' ? '✓' : '✕'} {notification.message}
          </div>
        </div>
      )}

      {/* Token Expiration Warning Banner */}
      {showTokenWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Sesi Anda akan berakhir dalam waktu kurang dari 5 menit
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Simpan pekerjaan Anda dan login ulang untuk melanjutkan
              </p>
            </div>
            <button
              onClick={() => setShowTokenWarning(false)}
              className="text-yellow-600 hover:text-yellow-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl p-8 shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="text-blue-600" /> Manajemen Pengguna
          </h1>
          {/* Only super_admin can add users */}
          {loggedUser?.role === "super_admin" && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
            >
              <UserPlus className="h-5 w-5" /> Tambah Pengguna
            </button>
          )}
        </div>

        {/* Tabs Filter */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-all ${
                  activeTab === tab.name
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.name
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-3">No</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">NIP</th>
                <th className="p-3">NIM</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 text-sm">Memuat data pengguna...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, i) => (
                  <tr
                    key={user.id_user}
                    className={`transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50`}
                  >
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-semibold text-gray-800">
                      {user.nama}
                    </td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === "Admin" || user.role === "Super Admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {user.role === "Admin" || user.role === "Super Admin" ? user.nip : "-"}
                    </td>
                    <td className="p-3">
                      {user.role === "Mahasiswa" ? user.nim : "-"}
                    </td>
                    <td className="p-3">
                      {user.role === "Mahasiswa" ? user.kelas : "-"}
                    </td>
                    <td className="p-3 flex gap-3">
                      {/* Only super_admin can edit and delete users */}
                      {loggedUser?.role === "super_admin" ? (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            disabled={isLoading}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          {user.role !== "Super Admin" ? (
                            <button
                              onClick={() => handleDeleteClick(user.id_user, user.nama)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" /> Hapus
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs italic">
                              Tidak dapat dihapus
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          View Only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-12">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-16 w-16 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        Belum ada data pengguna {activeTab !== "Semua" ? activeTab : ""}
                      </p>
                      {activeTab !== "Semua" && (
                        <p className="text-xs text-gray-400">
                          Coba pilih tab lain atau tambahkan pengguna baru
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {formMode === "add" ? "Tambah Pengguna" : "Edit Pengguna"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currentUser.nama}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, nama: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isLoading}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={currentUser.username}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, username: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={currentUser.email}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, email: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password {formMode === "add" && <span className="text-red-500">*</span>} {formMode === "edit" && "(Kosongkan jika tidak ingin mengubah)"}
                </label>
                <input
                  type="password"
                  required={formMode === "add"}
                  value={currentUser.password}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, password: e.target.value })
                  }
                  placeholder={formMode === "edit" ? "Kosongkan jika tidak diubah" : ""}
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isLoading}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={currentUser.role}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, role: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={isLoading}
                >
                  <option value="admin">Admin</option>
                  {/* Only super_admin can create/edit super_admin */}
                  {loggedUser?.role === "super_admin" && (
                    <option value="super_admin">Super Admin</option>
                  )}
                  <option value="mahasiswa">Mahasiswa</option>
                </select>
                {loggedUser?.role !== "super_admin" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Catatan: Hanya Super Admin yang dapat membuat akun Super Admin
                  </p>
                )}
              </div>

              {/* Field Admin/Super Admin */}
              {(currentUser.role === "admin" || currentUser.role === "super_admin") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    NIP (Nomor Induk Pegawai) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={currentUser.nip}
                    onChange={(e) =>
                      setCurrentUser({ ...currentUser, nip: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isLoading}
                    placeholder="Masukkan NIP"
                  />
                </div>
              )}

              {/* Field Mahasiswa */}
              {currentUser.role === "mahasiswa" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      NIM <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={currentUser.nim}
                      onChange={(e) =>
                        setCurrentUser({ ...currentUser, nim: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={isLoading}
                      placeholder="Masukkan NIM"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Kelas <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={currentUser.id_kelas || ""}
                      onChange={(e) =>
                        setCurrentUser({
                          ...currentUser,
                          id_kelas: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={isLoading}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {kelasList.map((kelas) => (
                        <option key={kelas.id_kelas} value={kelas.id_kelas}>
                          {kelas.nama_kelas}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {isLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Konfirmasi Hapus</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus pengguna <span className="font-semibold text-gray-900">"{deleteTarget?.nama}"</span>?
              <br />
              <span className="text-sm text-red-600 mt-2 block">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {isLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
