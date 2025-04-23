import {
  LayoutDashboard,
  FileText,
  User,
  CalendarClock,
  Coins,
  Settings,
  CalendarDays,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
  const menuItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Karyawan",
      url: "/karyawan",
      icon: User,
    },
    {
      title: "Penggajian",
      url: "/penggajian",
      icon: Coins,
    },
    {
      title: "Kehadiran",
      url: "/kehadiran",
      icon: CalendarClock,
    },
    {
      title: "Kalender",
      url: "/kalender",
      icon: CalendarDays,
    },
    {
      title: "Laporan",
      url: "/laporan",
      icon: FileText,
    },
    {
      title: "Pengaturan",
      url: "/pengaturan",
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-r bg-gray-50 py-4">
      <div className="px-6">
        <h1 className="text-xl font-bold">Gaji Kita Selaras</h1>
        <p className="text-sm text-muted-foreground">
          Sistem Penggajian Terpadu
        </p>
      </div>
      <ul className="mt-6 space-y-1">
        {menuItems.map((item) => (
          <li key={item.url}>
            <NavLink
              to={item.url}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-6 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
