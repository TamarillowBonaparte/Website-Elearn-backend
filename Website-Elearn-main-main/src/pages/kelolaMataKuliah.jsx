import DashboardLayout from "../layouts/dashboardlayout";
import { usePolling } from "../hooks/usePolling";
import { useState, useEffect } from "react";
import { navigationItems } from "../navigation/navigation";
import { BookOpen, Plus, Edit, Trash2, X, AlertCircle } from "lucide-react";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";

const API_BASE_URL = "http://localhost:8000";

export default function KelolaMataKuliah() {
  const [activeNav, setActiveNav] = useState("kelola-mata-kuliah");
  const [mataKuliahList, setMataKuliahList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMK, setSelectedMK] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    kode_mk: '',
    nama_mk: '',
    sks: '',
    semester: '',
    deskripsi: ''
  });

  // Get current user
  const currentUser = getUser() || {};
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  console.log('[kelolaMataKuliah] Current User:', currentUser);
  console.log('[kelolaMataKuliah] Role:', currentUser.role);
  console.log('[kelolaMataKuliah] isSuperAdmin:', isSuperAdmin);

  // Poll for updates every 5 seconds


  const fetchMataKuliah = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/mata-kuliah`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMataKuliahList(response.data);
    } catch (error) {
      console.error("Error fetching mata kuliah:", error);
      showNotification('error', 'Gagal memuat data mata kuliah');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Poll for updates every 5 seconds
  usePolling(fetchMataKuliah, 5000);

  const handleOpenModal = (mk = null) => {
    if (mk) {
      setIsEditMode(true);
      setSelectedMK(mk);
      setFormData({
        kode_mk: mk.kode_mk,
        nama_mk: mk.nama_mk,
        sks: mk.sks || '',
        semester: mk.semester || '',
        deskripsi: mk.deskripsi || ''
      });
    } else {
      setIsEditMode(false);
      setSelectedMK(null);
      setFormData({
        kode_mk: '',
        nama_mk: '',
        sks: '',
        semester: '',
        deskripsi: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setSelectedMK(null);
    setFormData({
      kode_mk: '',
      nama_mk: '',
      sks: '',
      semester: '',
      deskripsi: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.kode_mk || !formData.nama_mk) {
      showNotification('error', 'Kode MK dan Nama MK harus diisi');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        kode_mk: formData.kode_mk.trim(),
        nama_mk: formData.nama_mk.trim(),
        sks: formData.sks ? parseInt(formData.sks) : null,
        semester: formData.semester ? parseInt(formData.semester) : null,
        deskripsi: formData.deskripsi.trim() || null
      };

      if (isEditMode) {
        await axios.put(
          `${API_BASE_URL}/mata-kuliah/${selectedMK.kode_mk}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification('success', 'Mata kuliah berhasil diupdate');
      } else {
        await axios.post(
          `${API_BASE_URL}/mata-kuliah`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification('success', 'Mata kuliah berhasil ditambahkan');
      }

      handleCloseModal();
      fetchMataKuliah();
    } catch (error) {
      console.error("Error saving mata kuliah:", error);
      showNotification('error', error.response?.data?.detail || 'Gagal menyimpan mata kuliah');
    }
  };

  const handleDeleteClick = (kode_mk, nama_mk) => {
    setDeleteTarget({ kode_mk, nama_mk });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/mata-kuliah/${deleteTarget.kode_mk}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showNotification('success', 'Mata kuliah berhasil dihapus');
      fetchMataKuliah();
    } catch (error) {
      console.error("Error deleting mata kuliah:", error);
      showNotification('error', error.response?.data?.detail || 'Gagal menghapus mata kuliah');
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={navigationItems} activeNav={activeNav} setActiveNav={setActiveNav}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading mata kuliah...</p>
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
            <BookOpen className="text-blue-600" /> Kelola Mata Kuliah
          </h1>
          {isSuperAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="h-5 w-5" /> Tambah Mata Kuliah
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left py-3 px-4 font-semibold">Kode MK</th>
                <th className="text-left py-3 px-4 font-semibold">Nama Mata Kuliah</th>
                <th className="text-center py-3 px-4 font-semibold">SKS</th>
                <th className="text-center py-3 px-4 font-semibold">Semester</th>
                <th className="text-left py-3 px-4 font-semibold">Deskripsi</th>
                {isSuperAdmin && (
                  <th className="text-center py-3 px-4 font-semibold">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody>
              {mataKuliahList.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? "6" : "5"} className="text-center py-12 text-gray-500">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>Belum ada data mata kuliah</p>
                  </td>
                </tr>
              ) : (
                mataKuliahList.map((mk, index) => (
                  <tr
                    key={mk.kode_mk}
                    className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                  >
                    <td className="py-3 px-4 font-mono text-sm font-semibold">{mk.kode_mk}</td>
                    <td className="py-3 px-4 font-medium">{mk.nama_mk}</td>
                    <td className="py-3 px-4 text-center">{mk.sks || '-'}</td>
                    <td className="py-3 px-4 text-center">{mk.semester || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {mk.deskripsi ? (
                        <span title={mk.deskripsi}>
                          {mk.deskripsi.length > 50 ? mk.deskripsi.substring(0, 50) + '...' : mk.deskripsi}
                        </span>
                      ) : '-'}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenModal(mk)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                            title="Edit Mata Kuliah"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(mk.kode_mk, mk.nama_mk)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                            title="Hapus Mata Kuliah"
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

      {/* Modal Add/Edit */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} className="w-screen h-screen bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {isEditMode ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Kode MK */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Mata Kuliah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kode_mk}
                    onChange={(e) => setFormData({ ...formData, kode_mk: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: BD001"
                    disabled={isEditMode}
                    required
                    maxLength={20}
                  />
                </div>

                {/* Nama MK */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Mata Kuliah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_mk}
                    onChange={(e) => setFormData({ ...formData, nama_mk: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Basis Data"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* SKS */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKS
                    </label>
                    <input
                      type="number"
                      value={formData.sks}
                      onChange={(e) => setFormData({ ...formData, sks: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="1-6"
                      min="1"
                      max="6"
                    />
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <input
                      type="number"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="1-8"
                      min="1"
                      max="8"
                    />
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Deskripsi singkat mata kuliah"
                    maxLength={1000}
                  ></textarea>
                </div>
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
              Apakah Anda yakin ingin menghapus mata kuliah <span className="font-semibold text-gray-900">"{deleteTarget?.nama_mk}"</span>?
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
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
