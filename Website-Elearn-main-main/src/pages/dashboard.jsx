import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, BookOpen, FileText, CheckCircle, Calendar, TrendingUp
} from "lucide-react";
import DashboardLayout from "../layouts/dashboardlayout";
import { navigationItems } from "../navigation/navigation";
import { apiRequest } from "../utils/apiUtils";

const Dashboard = () => {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [userInfo, setUserInfo] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load dashboard data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Set user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserInfo(user);

    // Load dashboard stats
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/dashboard/stats', { method: 'GET' });
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading || !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData ? [
    {
      title: "Total Kelas Mata Kuliah",
      value: dashboardData.stats.total_kelas_mk.toString(),
      icon: BookOpen,
      color: "bg-blue-500"
    },
    {
      title: "Total Mahasiswa",
      value: dashboardData.stats.total_mahasiswa.toString(),
      icon: Users,
      color: "bg-green-500"
    },
    {
      title: "Total Materi",
      value: dashboardData.stats.total_materi.toString(),
      icon: FileText,
      color: "bg-purple-500"
    },
    {
      title: "Presensi Hari Ini",
      value: dashboardData.stats.presensi_hari_ini.toString(),
      icon: CheckCircle,
      color: "bg-orange-500"
    }
  ] : [];

  return (
    <DashboardLayout 
      navigationItems={navigationItems} 
      activeNav={activeNav} 
      setActiveNav={setActiveNav}
      onLogout={handleLogout}
    >
      <div className="lg:col-span-3 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Selamat Datang, {userInfo.username}!
              </h1>
              <p className="text-blue-100 text-lg">
                Dashboard E-Learning - Kelola presensi dan materi pembelajaran
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Presensi Table */}
        {dashboardData && dashboardData.recent_presensi.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Presensi Terbaru</h2>
                <p className="text-sm text-gray-500 mt-1">5 presensi terakhir yang dibuat</p>
              </div>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Mata Kuliah</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kelas</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Minggu Ke</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Hadir</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Alfa</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recent_presensi.map((presensi, index) => {
                    const persentaseHadir = presensi.total_mhs > 0 
                      ? Math.round((presensi.hadir / presensi.total_mhs) * 100) 
                      : 0;
                    
                    return (
                      <tr 
                        key={index} 
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{presensi.nama_mk}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{presensi.kelas}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
                            {presensi.pertemuan_ke}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {formatDate(presensi.tanggal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {presensi.hadir}/{presensi.total_mhs}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {presensi.alfa}/{presensi.total_mhs}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${persentaseHadir >= 75 ? 'bg-green-500' : persentaseHadir >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${persentaseHadir}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{persentaseHadir}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {dashboardData && dashboardData.recent_presensi.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Presensi</h3>
            <p className="text-gray-500">Generate presensi pertama Anda untuk mulai tracking kehadiran</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;