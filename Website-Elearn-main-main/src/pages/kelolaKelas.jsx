import DashboardLayout from "../layouts/dashboardlayout";
import { usePolling } from "../hooks/usePolling";
import { useState, useEffect } from "react";
import { navigationItems } from "../navigation/navigation";
import { School, Plus, Edit, Trash2, X, AlertCircle } from "lucide-react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth";
const API_BASE_URL = "http://localhost:8000";

export default function KelolaKelas() {
  const [activeNav, setActiveNav] = useState("kelola-kelas");
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    nama_kelas: '',
    prodi: 'TIF',
    tahun_angkatan: '',
    golongan: ''
  });

  // Get current user
  const currentUser = getUser() || {};
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';



  // Initial fetch
  useEffect(() => {
    fetchKelas();
  }, []);

  // Poll for updates every 5 seconds


  const fetchKelas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showNotification('error', 'Token otentikasi tidak ditemukan. Silakan login ulang.');
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/kelas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKelasList(response.data);
    } catch (error) {
      console.error("Error fetching kelas:", error);
      showNotification('error', 'Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates every 5 seconds
  usePolling(fetchKelas, 5000);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleOpenModal = (kelas = null) => {
    if (kelas) {
      setIsEditMode(true);
      setSelectedKelas(kelas);
      setFormData({
        nama_kelas: kelas.nama_kelas,
        prodi: kelas.prodi || 'TIF',
        tahun_angkatan: kelas.tahun_angkatan || '',
        golongan: kelas.golongan || ''
      });
    } else {
      setIsEditMode(false);
      setSelectedKelas(null);
      setFormData({
        nama_kelas: '',
        prodi: 'TIF',
        tahun_angkatan: '',
        golongan: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setSelectedKelas(null);
    setFormData({
      nama_kelas: '',
      prodi: 'TIF',
      tahun_angkatan: '',
      golongan: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nama_kelas.trim()) {
      showNotification('error', 'Nama kelas harus diisi');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showNotification('error', 'Token otentikasi tidak ditemukan. Silakan login ulang.');
        setLoading(false);
        return;
      }
      const payload = {
        nama_kelas: formData.nama_kelas.trim(),
        prodi: formData.prodi,
        tahun_angkatan: formData.tahun_angkatan ? parseInt(formData.tahun_angkatan) : null,
        golongan: formData.golongan.trim() || null
      };

      if (isEditMode) {
        await axios.put(
          `${API_BASE_URL}/kelas/${selectedKelas.id_kelas}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification('success', 'Kelas berhasil diupdate');
      } else {
        await axios.post(
          `${API_BASE_URL}/kelas`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification('success', 'Kelas berhasil ditambahkan');
      }

      handleCloseModal();
      fetchKelas();
    } catch (error) {
      console.error("Error saving kelas:", error);
      showNotification('error', error.response?.data?.detail || 'Gagal menyimpan kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id_kelas, nama_kelas) => {
    setDeleteTarget({ id_kelas, nama_kelas });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        showNotification('error', 'Token otentikasi tidak ditemukan. Silakan login ulang.');
        setLoading(false);
        return;
      }
      await axios.delete(`${API_BASE_URL}/kelas/${deleteTarget.id_kelas}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('success', 'Kelas berhasil dihapus');
      fetchKelas();
    } catch (error) {
      console.error("Error deleting kelas:", error);
      showNotification('error', error.response?.data?.detail || 'Gagal menghapus kelas');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
      setLoading(false);
    }
  };

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <DashboardLayout navigationItems={navigationItems} activeNav={activeNav} setActiveNav={setActiveNav}>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Akses Ditolak</h2>
          <p className="text-red-600">Halaman ini hanya dapat diakses oleh Super Admin</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} activeNav={activeNav} setActiveNav={setActiveNav}>
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}>
            {notification.type === 'success' ? '✓' : '✕'} {notification.message}
          </div>
        </div>
      )}

      <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <School className="text-blue-600" /> Kelola Kelas
          </h1>
          {isSuperAdmin && (
            <button
              onClick={() => handleOpenModal()}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <Plus className="h-5 w-5" /> Tambah Kelas
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left py-3 px-4 font-semibold">ID</th>
                <th className="text-left py-3 px-4 font-semibold">Nama Kelas</th>
                <th className="text-center py-3 px-4 font-semibold">Prodi</th>
                <th className="text-center py-3 px-4 font-semibold">Tahun Angkatan</th>
                <th className="text-center py-3 px-4 font-semibold">Golongan</th>
                {isSuperAdmin && (
                  <th className="text-center py-3 px-4 font-semibold">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? "6" : "5"} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 text-sm">Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : kelasList.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? "6" : "5"} className="text-center py-12 text-gray-500">
                    <School className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>Belum ada data kelas</p>
                  </td>
                </tr>
              ) : (
                kelasList.map((kelas, index) => (
                  <tr
                    key={kelas.id_kelas}
                    className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                  >
                    <td className="py-3 px-4 font-mono text-sm font-semibold">{kelas.id_kelas}</td>
                    <td className="py-3 px-4 font-medium">{kelas.nama_kelas}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${kelas.prodi === 'TIF' ? 'bg-blue-100 text-blue-700' :
                        kelas.prodi === 'MIF' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                        {kelas.prodi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{kelas.tahun_angkatan || '-'}</td>
                    <td className="py-3 px-4 text-center">{kelas.golongan || '-'}</td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenModal(kelas)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                            title="Edit Kelas"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(kelas.id_kelas, kelas.nama_kelas)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="h-4 w-4" /> Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} className="w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <School className="h-6 w-6" />
                {isEditMode ? 'Edit Kelas' : 'Tambah Kelas Baru'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: TIF-22-PA"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Studi <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.prodi}
                  onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="TIF">TIF - Teknik Informatika</option>
                  <option value="MIF">MIF - Manajemen Informatika</option>
                  <option value="TKK">TKK - Teknik Komputer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tahun Angkatan
                </label>
                <input
                  type="number"
                  value={formData.tahun_angkatan}
                  onChange={(e) => setFormData({ ...formData, tahun_angkatan: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: 2022"
                  min="2000"
                  max="2100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Golongan
                </label>
                <input
                  type="text"
                  value={formData.golongan}
                  onChange={(e) => setFormData({ ...formData, golongan: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: PA, PB, PC"
                  maxLength={10}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition font-medium"
                >
                  {isEditMode ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-lg transition font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} className="w-screen h-screen bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Konfirmasi Hapus</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus kelas <span className="font-semibold text-gray-900">"{deleteTarget?.nama_kelas}"</span>?
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
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
