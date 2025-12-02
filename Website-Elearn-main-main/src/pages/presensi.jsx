import DashboardLayout from "../layouts/dashboardlayout";
import { useState, useEffect } from "react";
import { navigationItems } from "../navigation/navigation";
import { UserCheck, Plus, Search, Filter, Eye, Calendar, Users, BookOpen, Clock, Trash, XCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Presensi() {
  const [activeNav, setActiveNav] = useState("presensi");
  const navigate = useNavigate();

  // State untuk Generate Presensi Baru
  const [generateForm, setGenerateForm] = useState({
    id_kelas_mk: "",
    minggu: "",
    tanggal: new Date().toISOString().split('T')[0],
    waktu_mulai: "",
    waktu_selesai: ""
  });

  // State untuk Filter Cek Presensi
  const [filterForm, setFilterForm] = useState({
    id_kelas_mk: "",
    minggu: ""
  });

  // State untuk data dari backend
  const [daftarKelasMK, setDaftarKelasMK] = useState([]);
  const [daftarPresensi, setDaftarPresensi] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get current user role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser.role === 'super_admin';
  
  // State untuk modal sukses
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  // State untuk delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deleteSuccessInfo, setDeleteSuccessInfo] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Load data kelas_mata_kuliah dari backend
  useEffect(() => {
    loadDataKelasMK();
  }, []);

  // Load presensi after kelasMK is loaded
  useEffect(() => {
    if (daftarKelasMK.length > 0 || isSuperAdmin) {
      loadDataPresensi();
    }
  }, [daftarKelasMK]);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  const loadDataKelasMK = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:8000/kelas-mata-kuliah/me", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Loaded kelas mata kuliah:", data);
        // Filter only active courses (case-insensitive)
        const activeData = data.filter(mk => mk.status && mk.status.toLowerCase() === 'aktif');
        setDaftarKelasMK(activeData);
      }
    } catch (error) {
      console.error("Error loading kelas mata kuliah:", error);
      showNotification('error', "⚠️ Gagal memuat data mata kuliah. Pastikan backend berjalan dan Anda sudah login!");
      setDaftarKelasMK([]);
    }
  };

  const loadDataPresensi = async () => {
    try {
      const response = await fetch("http://localhost:8000/presensi/list");
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Loaded presensi:", data);
        
        // Filter based on role
        if (isSuperAdmin) {
          // Super admin can see all presensi
          setDaftarPresensi(data);
        } else {
          // Admin (dosen) only see presensi from their kelas_mata_kuliah
          const myKelasMKIds = daftarKelasMK.map(mk => mk.id_kelas_mk);
          const filtered = data.filter(presensi => myKelasMKIds.includes(presensi.id_kelas_mk));
          setDaftarPresensi(filtered);
        }
      }
    } catch (error) {
      console.error("Error loading presensi:", error);
      setDaftarPresensi([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePresensi = async () => {
    if (!generateForm.id_kelas_mk || !generateForm.minggu || !generateForm.tanggal || !generateForm.waktu_mulai || !generateForm.waktu_selesai) {
      showNotification('error', "Mohon lengkapi semua field!");
      return;
    }

    // Cari info mata kuliah untuk ditampilkan di alert
    const selectedKelasMK = daftarKelasMK.find(mk => mk.id_kelas_mk === parseInt(generateForm.id_kelas_mk));

    // Kirim request ke backend
    const dataGenerate = {
      id_kelas_mk: parseInt(generateForm.id_kelas_mk),
      pertemuan_ke: parseInt(generateForm.minggu),
      tanggal: generateForm.tanggal,
      waktu_mulai: generateForm.waktu_mulai,
      waktu_selesai: generateForm.waktu_selesai
    };

    console.log("📤 Sending generate request:", dataGenerate);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:8000/presensi/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(dataGenerate)
      });

      const result = await response.json();

      if (response.ok) {
        // Simpan data untuk modal
        setSuccessData({
          kelas: selectedKelasMK?.nama_kelas || result.data.kelas,
          matkul: selectedKelasMK?.nama_mk || result.data.mata_kuliah,
          kode_mk: selectedKelasMK?.kode_mk || result.data.kode_mk,
          minggu: result.data.pertemuan_ke,
          tanggal: new Date(result.data.tanggal).toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          waktu_mulai: result.data.waktu_mulai,
          waktu_selesai: result.data.waktu_selesai,
          total_mahasiswa: result.data.total_mahasiswa
        });
        
        // Tampilkan modal sukses
        setShowSuccessModal(true);
        
        // Reset form
        setGenerateForm({
          id_kelas_mk: "",
          minggu: "",
          tanggal: new Date().toISOString().split('T')[0],
          waktu_mulai: "",
          waktu_selesai: ""
        });

        // Refresh list presensi
        loadDataPresensi();
      } else {
        showNotification('error', `❌ Error: ${result.detail || "Gagal generate presensi"}`);
      }
    } catch (error) {
      console.error("Error generate presensi:", error);
      showNotification('error', "❌ Terjadi kesalahan saat menghubungi server. Pastikan backend berjalan di http://localhost:8000");
    }
  };

  const handleLihatDetail = (presensi) => {
    // Navigasi ke halaman detail presensi dengan parameter yang benar
    navigate(`/presensi/detail/${presensi.id_kelas_mk}/${presensi.tanggal}/${presensi.pertemuan}`);
  };

  const handleDeletePresensi = (presensi) => {
    setDeleteTarget(presensi);
    setShowDeleteModal(true);
  };

  const confirmDeletePresensi = async () => {
    if (!deleteTarget) return;
    try {
      const url = `http://localhost:8000/presensi/delete/${deleteTarget.id_kelas_mk}/${deleteTarget.tanggal}/${deleteTarget.pertemuan}`;
      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        setDaftarPresensi(prev => prev.filter(p => !(p.id_kelas_mk === deleteTarget.id_kelas_mk && p.tanggal === deleteTarget.tanggal && p.pertemuan === deleteTarget.pertemuan)));
        setDeleteSuccessInfo({
          kelas: deleteTarget.kelas,
          matkul: deleteTarget.matkul,
          minggu: deleteTarget.pertemuan,
          tanggal: new Date(deleteTarget.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        });
        setShowDeleteModal(false);
        setShowDeleteSuccessModal(true);
        setDeleteTarget(null);
      } else {
        showNotification('error', `❌ Gagal menghapus presensi: ${result.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting presensi:', error);
      showNotification('error', '❌ Terjadi kesalahan saat menghapus presensi. Periksa koneksi ke backend.');
    }
  };

  const cancelDeletePresensi = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  // Filter presensi
  const filteredPresensi = daftarPresensi.filter(p => {
    const kelasMKMatch = !filterForm.id_kelas_mk || p.id_kelas_mk === parseInt(filterForm.id_kelas_mk);
    const mingguMatch = !filterForm.minggu || p.pertemuan.toString() === filterForm.minggu;
    return kelasMKMatch && mingguMatch;
  });

  if (loading) {
    return (
      <DashboardLayout navigationItems={navigationItems} activeNav={activeNav} setActiveNav={setActiveNav}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navigationItems={navigationItems} activeNav={activeNav} setActiveNav={setActiveNav}>
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

      <div className="space-y-6">
        
        {/* Section 1: Generate Presensi Baru */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200/50 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <Plus className="text-blue-600" /> Tambah Presensi Baru
            </h1>
            <p className="text-gray-600 text-sm">Generate daftar presensi untuk semua mahasiswa. Status awal: <span className="font-semibold">Belum Hadir</span> (Mahasiswa akan absen melalui mobile)</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Pilih Mata Kuliah (Kelas) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Mata Kuliah & Kelas <span className="text-red-500">*</span>
                </label>
                <select
                  value={generateForm.id_kelas_mk}
                  onChange={(e) => setGenerateForm({...generateForm, id_kelas_mk: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Pilih Mata Kuliah & Kelas --</option>
                  {daftarKelasMK.map(mk => (
                    <option key={mk.id_kelas_mk} value={mk.id_kelas_mk}>
                      [{mk.kode_mk}] {mk.nama_mk} - {mk.nama_kelas} ({mk.prodi}) | {mk.tahun_ajaran} Sem {mk.semester_aktif}
                    </option>
                  ))}
                </select>
                {daftarKelasMK.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ Tidak ada mata kuliah yang Anda ampu</p>
                )}
              </div>

              {/* Minggu Ke */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minggu Ke <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={generateForm.minggu}
                  onChange={(e) => setGenerateForm({...generateForm, minggu: e.target.value})}
                  min="1"
                  placeholder="Contoh: 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={generateForm.tanggal}
                  onChange={(e) => setGenerateForm({...generateForm, tanggal: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Waktu Mulai */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Waktu Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={generateForm.waktu_mulai}
                  onChange={(e) => setGenerateForm({...generateForm, waktu_mulai: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Waktu Selesai */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Waktu Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={generateForm.waktu_selesai}
                  onChange={(e) => setGenerateForm({...generateForm, waktu_selesai: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleGeneratePresensi}
              disabled={!generateForm.id_kelas_mk || !generateForm.minggu || !generateForm.tanggal || !generateForm.waktu_mulai || !generateForm.waktu_selesai}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Generate Presensi untuk Semua Mahasiswa
            </button>

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">💡 Info:</span> Setelah presensi digenerate, mahasiswa dapat melakukan absen melalui aplikasi mobile <span className="font-bold">hanya pada waktu yang telah ditentukan</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Filter & Cek Presensi yang Sudah Dibuat */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-gray-200/50 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <UserCheck className="text-green-600" /> Cek Presensi yang Sudah Dibuat
            </h1>
            <p className="text-gray-600 text-sm">Filter dan lihat detail presensi yang sudah dibuat</p>
          </div>

          {/* Filter */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="text-green-600 h-5 w-5" />
              <h2 className="text-lg font-semibold text-gray-900">Filter Presensi</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filter Mata Kuliah & Kelas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mata Kuliah & Kelas
                </label>
                <select
                  value={filterForm.id_kelas_mk}
                  onChange={(e) => setFilterForm({...filterForm, id_kelas_mk: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Semua Mata Kuliah</option>
                  {daftarKelasMK.map(mk => (
                    <option key={mk.id_kelas_mk} value={mk.id_kelas_mk}>
                      [{mk.kode_mk}] {mk.nama_mk} - {mk.nama_kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Minggu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minggu Ke
                </label>
                <input
                  type="number"
                  value={filterForm.minggu}
                  onChange={(e) => setFilterForm({...filterForm, minggu: e.target.value})}
                  min="1"
                  placeholder="Semua Minggu"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Daftar Presensi */}
          <div className="space-y-4">
            {filteredPresensi.length > 0 ? (
              filteredPresensi.map((presensi) => (
                <div
                  key={presensi.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Info Presensi */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-semibold">{presensi.kelas}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                          <BookOpen className="h-4 w-4" />
                          <span className="text-sm font-semibold">{presensi.matkul}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-semibold">Minggu {presensi.pertemuan}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-semibold">Tanggal:</span> {new Date(presensi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">Waktu Absen:</span> {presensi.waktu_mulai} - {presensi.waktu_selesai}
                        </div>
                      </div>

                      {/* Statistik */}
                      <div className="flex flex-wrap gap-4">
                        <div className="text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold text-gray-900 ml-1">{presensi.total_mhs}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Hadir:</span>
                          <span className="font-bold text-green-600 ml-1">{presensi.hadir}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Alpa:</span>
                          <span className="font-bold text-red-600 ml-1">{presensi.alpa}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all" 
                          style={{ width: `${(presensi.hadir / presensi.total_mhs) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleLihatDetail(presensi)}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-semibold"
                      >
                        <Eye className="h-5 w-5" />
                        Lihat Detail
                      </button>
                      <button
                        onClick={() => handleDeletePresensi(presensi)}
                        className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-semibold"
                        title="Hapus Presensi"
                      >
                        <Trash className="h-5 w-5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">Belum ada data presensi</p>
                <p className="text-gray-400 text-sm mt-2">Silakan generate presensi baru di bagian atas</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Success Modal dengan Animasi Checkmark */}
      {showSuccessModal && successData && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0}} className="w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[100] animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform animate-scaleIn shadow-2xl">
            {/* Animated Checkmark */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                  <svg className="w-16 h-16 text-green-600 animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-green-200 animate-ping opacity-75"></div>
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Presensi Berhasil Digenerate!
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Data presensi telah dibuat untuk semua mahasiswa
            </p>

            {/* Detail Info */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Kelas:</span>
                <span className="text-sm font-bold text-gray-900">{successData.kelas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Mata Kuliah:</span>
                <span className="text-sm font-bold text-gray-900">{successData.matkul}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Minggu:</span>
                <span className="text-sm font-bold text-gray-900">Ke-{successData.minggu}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Tanggal:</span>
                <span className="text-sm font-bold text-gray-900">{successData.tanggal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">Waktu:</span>
                <span className="text-sm font-bold text-gray-900">{successData.waktu_mulai} - {successData.waktu_selesai}</span>
              </div>
              <div className="pt-3 border-t border-indigo-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Total Mahasiswa:</span>
                  <span className="text-lg font-bold text-blue-600">{successData.total_mahasiswa} orang</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            {/* <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">Status Awal: Belum Absen</p>
                  <p>• Mahasiswa dapat absen via mobile app pada waktu yang ditentukan</p>
                  <p>• Status otomatis berubah menjadi ALFA jika melewati waktu selesai</p>
                </div>
              </div>
            </div> */}

            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0}} className="w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[100] animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 transform animate-scaleIn shadow-xl">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                  <Trash className="w-10 h-10 text-red-600" />
                </div>
                <div className="absolute inset-0 w-20 h-20 rounded-full bg-red-200 animate-ping opacity-70"></div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Konfirmasi Hapus Presensi</h2>
            <p className="text-center text-gray-600 text-sm mb-4">Tindakan ini akan menghapus semua record presensi untuk pertemuan ini.</p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Kelas:</span><span className="font-semibold text-gray-900">{deleteTarget.kelas}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Mata Kuliah:</span><span className="font-semibold text-gray-900">{deleteTarget.matkul}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Minggu:</span><span className="font-semibold text-gray-900">Ke-{deleteTarget.pertemuan}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Tanggal:</span><span className="font-semibold text-gray-900">{new Date(deleteTarget.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={cancelDeletePresensi} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5" /> Batal
              </button>
              <button onClick={confirmDeletePresensi} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <Trash className="h-5 w-5" /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccessModal && deleteSuccessInfo && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0}} className="w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-[100] animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 transform animate-scaleIn shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
                  <Trash className="w-14 h-14 text-red-600" />
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-red-200 animate-ping opacity-75"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Presensi Dihapus</h2>
            <p className="text-center text-gray-600 mb-6">Data presensi untuk pertemuan ini berhasil dihapus.</p>
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 mb-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Kelas:</span><span className="font-bold text-gray-900">{deleteSuccessInfo.kelas}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Mata Kuliah:</span><span className="font-bold text-gray-900">{deleteSuccessInfo.matkul}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Minggu:</span><span className="font-bold text-gray-900">Ke-{deleteSuccessInfo.minggu}</span></div>
              <div className="flex justify-between"><span className="text-gray-600 font-medium">Tanggal:</span><span className="font-bold text-gray-900">{deleteSuccessInfo.tanggal}</span></div>
            </div>
            <button onClick={() => { setShowDeleteSuccessModal(false); setDeleteSuccessInfo(null); }} className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-rose-700 transition-all transform hover:scale-105 shadow-lg">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Add CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes checkmark {
          0% { stroke-dasharray: 0, 100; }
          100% { stroke-dasharray: 100, 0; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-checkmark {
          stroke-dasharray: 100;
          animation: checkmark 0.6s ease-in-out 0.2s forwards;
        }
      `}</style>
    </DashboardLayout>
  );
}
