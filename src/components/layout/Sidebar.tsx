/* src/components/layout/Sidebar.tsx */
import {
  LayoutDashboard,
  FileText,
  User,
  CalendarClock,
  Coins,
  Settings,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar = ({ isCollapsed, toggleCollapse }: SidebarProps) => {
  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Karyawan", url: "/karyawan", icon: User },
    { title: "Penggajian", url: "/penggajian", icon: Coins },
    { title: "Kehadiran", url: "/kehadiran", icon: CalendarClock },
    { title: "Kalender", url: "/kalender", icon: CalendarDays },
    { title: "Laporan", url: "/laporan", icon: FileText },
    { title: "Pengaturan", url: "/pengaturan", icon: Settings },
  ];

  return (
    <div
      className={`${
        isCollapsed ? "w-16" : "w-64"
      } flex-shrink-0 border-r bg-sidebar py-4 transition-all duration-300`}
    >
      <div className="px-6 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Payroll System</h1>
            <p className="text-sm text-sidebar-foreground/80">
              Sistem Penggajian Terpadu
            </p>
          </div>
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      <ul className="mt-6 space-y-1">
        {menuItems.map((item) => (
          <li key={item.url}>
            <NavLink
              to={item.url}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-6 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${isCollapsed ? "justify-center space-x-0" : ""}`
              }
            >
              <item.icon className="h-4 w-4" />
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
