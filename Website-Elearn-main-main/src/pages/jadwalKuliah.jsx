import DashboardLayout from "../layouts/dashboardlayout";
import { usePolling } from "../hooks/usePolling";
import { useState, useEffect } from "react";
import { navigationItems } from "../navigation/navigation";
import { CalendarDays, Clock, MapPin, Plus, Edit, Trash2, X, AlertCircle } from "lucide-react";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";

const API_BASE_URL = "http://localhost:8000";

export default function JadwalKuliah() {
  const [activeNav, setActiveNav] = useState("jadwal-kuliah");
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [kelasMkList, setKelasMkList] = useState([]);

  const [formData, setFormData] = useState({
    id_kelas_mk: '',
    hari: 'Senin',
    jam_mulai: '',
    jam_selesai: '',
    ruangan: ''
  });

  // Get current user
  const currentUser = getUser() || {};
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // Format time from HH:MM:SS to HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // Get only HH:MM
  };



  useEffect(() => {
    fetchJadwal();
    if (isSuperAdmin) {
      fetchKelasMk();
    }
  }, []);

  // Poll for updates every 5 seconds


  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/jadwal-kuliah/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJadwal(response.data);
    } catch (error) {
      console.error("Error fetching jadwal:", error);
      showNotification('error', 'Gagal memuat data jadwal');
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates every 5 seconds
  usePolling(fetchJadwal, 5000);

  const fetchKelasMk = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/kelas-mata-kuliah`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKelasMkList(response.data);
    } catch (error) {
      console.error("Error fetching kelas mata kuliah:", error);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleOpenModal = (jadwalItem = null) => {
    if (jadwalItem) {
      setIsEditMode(true);
      setSelectedJadwal(jadwalItem);
      setFormData({
        id_kelas_mk: jadwalItem.id_kelas_mk || '',
        hari: jadwalItem.hari || 'Senin',
        jam_mulai: jadwalItem.jam_mulai || '',
        jam_selesai: jadwalItem.jam_selesai || '',
        ruangan: jadwalItem.ruangan || ''
      });
    } else {
      setIsEditMode(false);
      setSelectedJadwal(null);
      setFormData({
        id_kelas_mk: '',
        hari: 'Senin',
        jam_mulai: '',
        jam_selesai: '',
        ruangan: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setSelectedJadwal(null);
    setFormData({
      id_kelas_mk: '',
      hari: 'Senin',
      jam_mulai: '',
      jam_selesai: '',
      ruangan: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id_kelas_mk || !formData.hari) {
      showNotification('error', 'Kelas Mata Kuliah dan Hari harus diisi');
      return;
    }

    try {
      setLoading(true);
      const token = getToken();

      const payload = {
        id_kelas_mk: parseInt(formData.id_kelas_mk),
        hari: formData.hari,
        jam_mulai: formData.jam_mulai || null,
        jam_selesai: formData.jam_selesai || null,
        ruangan: formData.ruangan || null
      };

      if (isEditMode) {
        await axios.put(
          `${API_BASE_URL}/jadwal-kuliah/${selectedJadwal.id_jadwal}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification('success', 'Jadwal berhasil diperbarui');
      } else {
        await axios.post(
          `${API_BASE_URL}/jadwal-kuliah`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification('success', 'Jadwal berhasil ditambahkan');
      }

      handleCloseModal();
      fetchJadwal();
    } catch (error) {
      console.error("Error saving jadwal:", error);
      const errorMsg = error.response?.data?.detail || 'Gagal menyimpan jadwal';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id_jadwal, jadwalInfo) => {
    setDeleteTarget({ id_jadwal, info: jadwalInfo });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      const token = getToken();
      await axios.delete(`${API_BASE_URL}/jadwal-kuliah/${deleteTarget.id_jadwal}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('success', 'Jadwal berhasil dihapus');
      fetchJadwal();
    } catch (error) {
      console.error("Error deleting jadwal:", error);
      const errorMsg = error.response?.data?.detail || 'Gagal menghapus jadwal';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  if (loading && jadwal.length === 0) {
    return (
      <DashboardLayout navigationItems={navigationItems} activeNav={activeNav} setActiveNav={setActiveNav}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Memuat jadwal...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      navigationItems={navigationItems}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
    >
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 mb-8 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-xl">
              <CalendarDays className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Jadwal Kuliah</h1>
              <p className="text-blue-100 text-sm">
                {isSuperAdmin ? 'Kelola jadwal perkuliahan' : 'Jadwal perkuliahan yang Anda ampu'}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-lg font-medium transition shadow-md"
            >
              <Plus className="h-5 w-5" />
              Tambah Jadwal
            </button>
          )}
        </div>
      </div>

      {/* Tabel jadwal kuliah */}
      <div className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <CalendarDays className="text-blue-600 h-6 w-6" />
          <h2 className="text-2xl font-semibold text-gray-800">Daftar Jadwal</h2>
        </div>

        {jadwal.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tidak ada jadwal kuliah</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-3 px-4 text-left rounded-tl-lg">Kode MK</th>
                  <th className="py-3 px-4 text-left">Mata Kuliah</th>
                  <th className="py-3 px-4 text-left">Kelas</th>
                  <th className="py-3 px-4 text-left">Dosen</th>
                  <th className="py-3 px-4 text-left">Prodi</th>
                  <th className="py-3 px-4 text-left">Tahun Ajaran</th>
                  <th className="py-3 px-4 text-left">Semester</th>
                  <th className="py-3 px-4 text-left">Hari</th>
                  <th className="py-3 px-4 text-left">Jam</th>
                  <th className="py-3 px-4 text-left">Ruangan</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-center rounded-tr-lg">Aksi</th>}
                  {!isSuperAdmin && <th className="py-3 px-4 text-left rounded-tr-lg"></th>}
                </tr>
              </thead>

              <tbody>
                {jadwal.map((item, index) => (
                  <tr
                    key={item.id_jadwal}
                    className={`border-b last:border-0 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/60"
                      } hover:bg-blue-100/40 transition`}
                  >
                    <td className="py-2 px-4 font-mono text-xs text-gray-700">{item.kode_mk}</td>
                    <td className="py-2 px-4 text-gray-800 font-medium">{item.nama_mk}</td>
                    <td className="py-2 px-4 text-gray-600">{item.nama_kelas}</td>
                    <td className="py-2 px-4 text-gray-600">{item.nama_dosen}</td>
                    <td className="py-2 px-4 text-gray-600">{item.prodi}</td>
                    <td className="py-2 px-4 text-gray-600">{item.tahun_ajaran}</td>
                    <td className="py-2 px-4 text-center">{item.semester_aktif}</td>
                    <td className="py-2 px-4 text-gray-700">{item.hari}</td>
                    <td className="py-2 px-4 text-gray-700 whitespace-nowrap">
                      <Clock className="h-4 w-4 text-blue-500 inline mr-1" />
                      {formatTime(item.jam_mulai)} - {formatTime(item.jam_selesai)}
                    </td>
                    <td className="py-2 px-4 text-gray-700">
                      <MapPin className="h-4 w-4 text-blue-500 inline mr-1" />
                      {item.ruangan || '-'}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-2 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id_jadwal, `${item.nama_mk} - ${item.hari}`)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} className="w-screen h-screen bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-semibold">
                {isEditMode ? 'Edit Jadwal' : 'Tambah Jadwal'}
              </h2>
              <button onClick={handleCloseModal} className="text-white hover:text-gray-200 transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kelas Mata Kuliah <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.id_kelas_mk}
                  onChange={(e) => setFormData({ ...formData, id_kelas_mk: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isEditMode}
                >
                  <option value="">-- Pilih Kelas Mata Kuliah --</option>
                  {kelasMkList.map(kmk => (
                    <option key={kmk.id_kelas_mk} value={kmk.id_kelas_mk}>
                      {kmk.kode_mk} - {kmk.nama_mk} ({kmk.nama_kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hari <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.hari}
                  onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Minggu">Minggu</option>
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={formData.jam_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={formData.jam_selesai}
                    onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ruangan
                </label>
                <input
                  type="text"
                  value={formData.ruangan}
                  onChange={(e) => setFormData({ ...formData, ruangan: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contoh: R-201, Lab-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : (isEditMode ? 'Perbarui' : 'Simpan')}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2.5 rounded-lg font-medium transition"
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
              Apakah Anda yakin ingin menghapus jadwal <span className="font-semibold text-gray-900">"{deleteTarget?.info}"</span>?
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
