// src/navigation/navigation.jsx
import { 
  LayoutDashboard, Calendar, CheckCircle, BookOpen,
  GraduationCap, CalendarDays, User, Users, Info, School
} from "lucide-react";

export const navigationItems = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Assignment-Kelas", label: "Assignment Kelas", icon: Calendar, superAdminOnly: true },
  { id: "jadwal-kuliah", label: "Jadwal Kuliah", icon: CalendarDays },
  { id: "presensi", label: "Input Presensi", icon: CheckCircle },
  { id: "materi", label: "Materi", icon: BookOpen },
  { id: "profil-saya", label: "Profil Saya", icon: User, adminOnly: true }, // admin (dosen) only
  { id: "informasi", label: "Kelola Informasi", icon: Info, superAdminOnly: true }, // super_admin only
  { id: "kelola-mata-kuliah", label: "Kelola Mata Kuliah", icon: BookOpen, superAdminOnly: true },
  { id: "kelola-kelas", label: "Kelola Kelas", icon: School, superAdminOnly: true },
  { id: "kelola-dosen", label: "Kelola Dosen", icon: Users, superAdminOnly: true },
  { id: "User", label: "User", icon: User, superAdminOnly: true },
];
