// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/dashboard";
import MataKuliah from "./pages/mataKuliah";
import Presensi from "./pages/presensi";
import DetailPresensi from "./pages/detailPresensi";
import DetailPresensiAbsen from "./pages/detailPresensiAbsen";
import JadwalKuliah from "./pages/jadwalKuliah";
import Materi from "./pages/materi";
import DetailMateri from "./pages/detailMateri";
import ViewMinggu from "./pages/minggu"; // ✅ TAMBAHKAN INI
import MingguMateri from "./pages/mingguMateri";
import UserPage from "./pages/user";
import KelolaDosen from "./pages/kelolaDosen";
import DetailProfilDosen from "./pages/detailProfilDosen";
import ProfilSaya from "./pages/profilSaya";
import Informasi from "./pages/informasi";
import InformasiForm from "./pages/informasiForm";
import KelolaMataKuliah from "./pages/kelolaMataKuliah";
import KelolaKelas from "./pages/kelolaKelas";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const protectedRoutes = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/mata-kuliah", element: <MataKuliah />, roles: ["super_admin"] },
    { path: "/presensi", element: <Presensi /> },
    { path: "/presensi/detail/:id_kelas_mk/:tanggal/:pertemuan_ke", element: <DetailPresensiAbsen /> },
    { path: "/presensi/:id_kelas_mk", element: <DetailPresensi /> },
    { path: "/jadwal-kuliah", element: <JadwalKuliah /> },
    { path: "/materi", element: <Materi /> },
    { path: "/materi/kelas-mk/:id_kelas_mk", element: <DetailMateri /> },
    { path: "/materi/:id_kelas_mk/minggu/view", element: <ViewMinggu /> },
    { path: "/materi/:id_kelas_mk/minggu/:minggu", element: <MingguMateri /> },
    { path: "/informasi", element: <Informasi />, roles: ["super_admin"] },
    { path: "/informasi/create", element: <InformasiForm />, roles: ["super_admin"] },
    { path: "/informasi/edit/:id", element: <InformasiForm />, roles: ["super_admin"] },
    { path: "/kelola-mata-kuliah", element: <KelolaMataKuliah />, roles: ["super_admin"] },
    { path: "/kelola-kelas", element: <KelolaKelas />, roles: ["super_admin"] },
    { path: "/kelola-dosen", element: <KelolaDosen />, roles: ["super_admin"] },
    { path: "/detail-profil-dosen/:id_dosen", element: <DetailProfilDosen />, roles: ["super_admin"] },
    { path: "/profil-saya", element: <ProfilSaya />, roles: ["admin"] },
    { path: "/user", element: <UserPage />, roles: ["super_admin"] },
  ];

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          localStorage.getItem('token')
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        }
      />

      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<ProtectedRoute allowedRoles={route.roles}>{route.element}</ProtectedRoute>}
        />
      ))}

      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center px-4">
              <div className="mb-8">
                <h1 className="text-9xl font-bold text-gray-200">404</h1>
                <div className="text-6xl font-bold text-gray-800 -mt-8">Oops!</div>
              </div>
              <p className="text-2xl text-gray-600 mb-4 font-semibold">
                Halaman tidak ditemukan
              </p>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Halaman yang Anda cari mungkin telah dihapus, namanya berubah, atau sementara tidak tersedia.
              </p>
              <a
                href="/dashboard"
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Kembali ke Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}