// import "./Sidebar.css";

// export default function Sidebar({ navigationItems, activeNav, setActiveNav }) {
//   return (
//     <div className="sidebar">
//       <h2 className="sidebar-title">Menu Utama</h2>
//       <nav className="sidebar-nav">
//         {navigationItems.map((item) => {
//           const Icon = item.icon;
//           const isActive = activeNav === item.id;
//           return (
//             <button
//               key={item.id}
//               onClick={() => setActiveNav(item.id)}
//               className={`sidebar-item ${isActive ? "active" : "inactive"}`}
//             >
//               <Icon className="sidebar-icon" />
//               <span className="sidebar-label">{item.label}</span>
//             </button>
//           );
//         })}
//       </nav>
//     </div>
//   );
// }

// src/components/sidebar.jsx
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
import { getRole } from "../utils/auth";

export default function Sidebar({
  navigationItems,
  activeNav,
  setActiveNav,
  onCloseMobile,
}) {
  const navigate = useNavigate();

  const routes = {
    Dashboard: "/dashboard",
    "Assignment-Kelas": "/mata-kuliah",
    "jadwal-kuliah": "/jadwal-kuliah",
    presensi: "/presensi",
    materi: "/materi",
    informasi: "/informasi",
    "profil-saya": "/profil-saya",
    "kelola-mata-kuliah": "/kelola-mata-kuliah",
    "kelola-kelas": "/kelola-kelas",
    "kelola-dosen": "/kelola-dosen",
    User: "/user",
  };

  const handleNavigation = (item) => {
    console.log("🔵 Navigation clicked:", item.id); // ✅ Debug log
    setActiveNav(item.id);

    // Tutup mobile sidebar saat navigasi
    if (onCloseMobile) {
      onCloseMobile();
    }

    // cek apakah ID-nya punya rute
    if (routes[item.id]) {
      console.log("✅ Navigating to:", routes[item.id]); // ✅ Debug log
      navigate(routes[item.id]);
    } else {
      console.warn("⚠️ Route not found for:", item.id); // ✅ Debug log
    }
  };

  const userRole = getRole();

  return (
    <div className="sidebar lg:bg-transparent bg-white h-screen lg:h-auto overflow-y-auto">
      <h2 className="sidebar-title pt-4 lg:pt-0">Menu Utama</h2>
      <nav className="sidebar-nav">
        {navigationItems.map((item) => {
          // Hide super admin only items from non-super-admin users
          if (item.superAdminOnly && userRole !== "super_admin") {
            return null;
          }

          // Hide admin only items from non-admin users (admin = dosen, don't show to super_admin)
          if (item.adminOnly && userRole !== "admin") {
            return null;
          }

          // Hide admin+super_admin items from mahasiswa
          if (item.adminAndSuperAdmin && userRole !== "admin" && userRole !== "super_admin") {
            return null;
          }

          const Icon = item.icon;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={`sidebar-item ${isActive ? "active" : "inactive"}`}
            >
              <Icon className="sidebar-icon" />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
