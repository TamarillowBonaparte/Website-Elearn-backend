// src/pages/kelolaDosen.jsx
import DashboardLayout from "../layouts/dashboardlayout";
import { usePolling } from "../hooks/usePolling";
import { useState, useEffect } from "react";
import { navigationItems } from "../navigation/navigation";
import { Users, Edit2, AlertCircle, BookOpen, X, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { getUser, getToken } from "../utils/auth";

const API_BASE_URL = "http://localhost:8000";

export default function KelolaDosen() {
  const [activeNav, setActiveNav] = useState("kelola-dosen");
  const [dosenList, setDosenList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Get current user info
  const currentUser = getUser() || {};
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nama_dosen: '',
    email_dosen: '',
    no_hp: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    agama: '',
    alamat: ''
  });

  // Form state for adding new assignment
  const [showAddForm, setShowAddForm] = useState(false);
  const [kelasList, setKelasList] = useState([]);
  const [matkulList, setMatkulList] = useState([]);
  const [formData, setFormData] = useState({
    id_kelas: "",
    kode_mk: "",
    tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    semester_aktif: "Ganjil"
  });
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });



  useEffect(() => {
    fetchAllDosen();
    fetchKelasList();
    fetchMatkulList();
  }, []);

  // Poll for updates every 5 seconds


  const fetchAllDosen = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/dosen`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDosenList(response.data);
    } catch (error) {
      console.error("Error fetching dosen:", error);
      showNotification('error', 'Gagal memuat data dosen');
    } finally {
      setLoading(false);
    }
  };

  // Poll for updates every 5 seconds
  usePolling(fetchAllDosen, 5000);

  const fetchKelasList = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/kelas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKelasList(response.data);
    } catch (error) {
      console.error("Error fetching kelas:", error);
    }
  };

  const fetchMatkulList = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/mata-kuliah`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatkulList(response.data);
    } catch (error) {
      console.error("Error fetching mata kuliah:", error);
    }
  };

  const fetchDosenAssignments = async (id_dosen) => {
    try {
      setLoadingAssignments(true);
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/kelas-mata-kuliah/dosen/${id_dosen}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      showNotification('error', 'Gagal memuat data assignment');
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleOpenModal = (dosen) => {
    setSelectedDosen(dosen);
    setShowModal(true);
    setShowAddForm(false);
    fetchDosenAssignments(dosen.id_dosen);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDosen(null);
    setAssignments([]);
    setShowAddForm(false);
    setFormData({
      id_kelas: "",
      kode_mk: "",
      tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
      semester_aktif: "Ganjil"
    });
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();

    if (!formData.id_kelas || !formData.kode_mk) {
      showNotification('error', 'Kelas dan Mata Kuliah harus dipilih');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/kelas-mata-kuliah`,
        {
          id_dosen: selectedDosen.id_dosen,
          kode_mk: formData.kode_mk,
          id_kelas: parseInt(formData.id_kelas),
          tahun_ajaran: formData.tahun_ajaran,
          semester_aktif: formData.semester_aktif,
          status: "Aktif"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('success', 'Assignment berhasil ditambahkan');
      setShowAddForm(false);
      setFormData({
        id_kelas: "",
        kode_mk: "",
        tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
        semester_aktif: "Ganjil"
      });
      fetchDosenAssignments(selectedDosen.id_dosen);
    } catch (error) {
      console.error("Error adding assignment:", error);
      showNotification('error', error.response?.data?.detail || 'Gagal menambahkan assignment');
    }
  };

  const handleDeleteAssignment = async (id_kelas_mk) => {
    if (!confirm('Hapus assignment ini? Dosen tidak akan bisa mengakses mata kuliah ini lagi.')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/kelas-mata-kuliah/${id_kelas_mk}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showNotification('success', 'Assignment berhasil dihapus');
      fetchDosenAssignments(selectedDosen.id_dosen);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      showNotification('error', 'Gagal menghapus assignment');
    }
  };

  const handleToggleStatus = async (id_kelas_mk, currentStatus) => {
    const newStatus = currentStatus === 'Aktif' ? 'Selesai' : 'Aktif';

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/kelas-mata-kuliah/${id_kelas_mk}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('success', `Status berhasil diubah menjadi ${newStatus}`);
      fetchDosenAssignments(selectedDosen.id_dosen);
    } catch (error) {
      console.error("Error updating status:", error);
      showNotification('error', error.response?.data?.detail || 'Gagal mengubah status');
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const handleOpenEditModal = (dosen) => {
    setSelectedDosen(dosen);
    setEditFormData({
      nama_dosen: dosen.nama_dosen || '',
      email_dosen: dosen.email_dosen || '',
      no_hp: dosen.no_hp || '',
      tempat_lahir: dosen.tempat_lahir || '',
      tanggal_lahir: dosen.tanggal_lahir || '',
      jenis_kelamin: dosen.jenis_kelamin || '',
      agama: dosen.agama || '',
      alamat: dosen.alamat || ''
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedDosen(null);
    setEditFormData({
      nama_dosen: '',
      email_dosen: '',
      no_hp: '',
      tempat_lahir: '',
      tanggal_lahir: '',
      jenis_kelamin: '',
      agama: '',
      alamat: ''
    });
  };

  const handleUpdateDosen = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/users/dosen/${selectedDosen.id_user}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification('success', 'Data dosen berhasil diupdate');
      handleCloseEditModal();
      fetchAllDosen();
    } catch (error) {
      console.error("Error updating dosen:", error);
      showNotification('error', error.response?.data?.detail || 'Gagal update data dosen');
    }
  };

  if (loading) {
    return (
      <DashboardLayout navigationItems={navigationItems} activeNav={activeNav} setActiveNav={setActiveNav}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading dosen...</p>
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
            <Users className="text-blue-600" /> Kelola Dosen
          </h1>
        </div>

        {/* Dosen Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="text-left py-3 px-4 font-semibold">NIP</th>
                <th className="text-left py-3 px-4 font-semibold">Nama Dosen</th>
                <th className="text-left py-3 px-4 font-semibold">Email</th>
                <th className="text-left py-3 px-4 font-semibold">No HP</th>
                <th className="text-left py-3 px-4 font-semibold">Jenis Kelamin</th>
                <th className="text-center py-3 px-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dosenList.map((dosen) => (
                <tr key={dosen.id_dosen} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{dosen.nip}</td>
                  <td className="py-3 px-4 text-sm font-medium">{dosen.nama_dosen}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{dosen.email_dosen || dosen.email || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{dosen.no_hp || '-'}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${dosen.jenis_kelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                      {dosen.jenis_kelamin === 'L' ? 'Laki-laki' : dosen.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {isSuperAdmin ? (
                        <>
                          <button
                            onClick={() => window.location.href = `/detail-profil-dosen/${dosen.id_dosen}`}
                            disabled={loading}
                            className="text-purple-600 hover:text-purple-800 flex items-center gap-1 disabled:opacity-50"
                            title="Lihat Detail Profil"
                          >
                            <Users className="h-4 w-4" /> Detail
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(dosen)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                            title="Edit Data Dosen"
                          >
                            <Edit2 className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleOpenModal(dosen)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1 disabled:opacity-50"
                            title="Kelola Assignment"
                          >
                            <BookOpen className="h-4 w-4" /> Akses
                          </button>
                        </>
                      ) : (
                        // Dosen only see their own data
                        currentUser.id_user === dosen.id_user && (
                          <button
                            onClick={() => window.location.href = '/profil-saya'}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                            title="Lihat Profil Saya"
                          >
                            <Users className="h-4 w-4" /> Profil Saya
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {dosenList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada data dosen</p>
          </div>
        )}
      </div>

      {/* Modal Kelola Assignment */}
      {showModal && selectedDosen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} className="w-screen h-screen bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Kelola Akses Dosen
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDosen.nama_dosen} ({selectedDosen.nip})
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Add Assignment Button */}
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 mb-4 transition font-medium"
              >
                <Plus className="h-5 w-5" /> Tambah Assignment Baru
              </button>
            )}

            {/* Add Assignment Form */}
            {showAddForm && (
              <form onSubmit={handleAddAssignment} className="bg-gray-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3">Tambah Assignment Baru</h4>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelas <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.id_kelas}
                      onChange={(e) => setFormData({ ...formData, id_kelas: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pilih Kelas</option>
                      {kelasList.map(kelas => (
                        <option key={kelas.id_kelas} value={kelas.id_kelas}>
                          {kelas.nama_kelas} - {kelas.prodi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mata Kuliah <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.kode_mk}
                      onChange={(e) => setFormData({ ...formData, kode_mk: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Pilih Mata Kuliah</option>
                      {matkulList.map(mk => (
                        <option key={mk.kode_mk} value={mk.kode_mk}>
                          {mk.nama_mk} ({mk.kode_mk})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tahun Ajaran
                    </label>
                    <input
                      type="text"
                      value={formData.tahun_ajaran}
                      onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="2024/2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <select
                      value={formData.semester_aktif}
                      onChange={(e) => setFormData({ ...formData, semester_aktif: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition font-medium"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}

            {/* Current Assignments */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Assignment Saat Ini</h4>
              {loadingAssignments ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>Belum ada assignment</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id_kelas_mk}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-800">
                            {assignment.nama_mk} ({assignment.kode_mk})
                          </h5>
                          <p className="text-sm text-gray-600">
                            {assignment.nama_kelas} • {assignment.prodi} • {assignment.tahun_ajaran} • Semester {assignment.semester_aktif}
                          </p>
                          <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${assignment.status === 'Aktif'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'Selesai'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}>
                            {assignment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          {/* Toggle Status Switch */}
                          <button
                            onClick={() => handleToggleStatus(assignment.id_kelas_mk, assignment.status)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${assignment.status === 'Aktif' ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            title={`Status: ${assignment.status}. Klik untuk mengubah ke ${assignment.status === 'Aktif' ? 'Selesai' : 'Aktif'}`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${assignment.status === 'Aktif' ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id_kelas_mk)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            title="Hapus Assignment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Dosen */}
      {showEditModal && selectedDosen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }} className="w-screen h-screen bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Edit Data Dosen</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDosen.nip} - {selectedDosen.nama_dosen}
                </p>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateDosen}>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Nama Dosen */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Dosen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.nama_dosen}
                    onChange={(e) => setEditFormData({ ...editFormData, nama_dosen: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email_dosen}
                    onChange={(e) => setEditFormData({ ...editFormData, email_dosen: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* No HP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No HP
                  </label>
                  <input
                    type="text"
                    value={editFormData.no_hp}
                    onChange={(e) => setEditFormData({ ...editFormData, no_hp: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={editFormData.tempat_lahir}
                    onChange={(e) => setEditFormData({ ...editFormData, tempat_lahir: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={editFormData.tanggal_lahir}
                    onChange={(e) => setEditFormData({ ...editFormData, tanggal_lahir: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={editFormData.jenis_kelamin}
                    onChange={(e) => setEditFormData({ ...editFormData, jenis_kelamin: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                {/* Agama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agama
                  </label>
                  <select
                    value={editFormData.agama}
                    onChange={(e) => setEditFormData({ ...editFormData, agama: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Buddha">Buddha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>

                {/* Alamat */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    value={editFormData.alamat}
                    onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition font-medium"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-lg transition font-medium"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
