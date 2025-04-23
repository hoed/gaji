
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Users,
  Calculator,
  Calendar,
  FileText,
  Home,
  Settings,
  ArrowLeftFromLine,
  ArrowRightFromLine
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SidebarItemProps = {
  icon: React.ElementType;
  text: string;
  to: string;
  isCollapsed: boolean;
  isActive: boolean;
};

const SidebarItem = ({ icon: Icon, text, to, isCollapsed, isActive }: SidebarItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
        isActive 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon size={20} />
      {!isCollapsed && <span className="text-sm font-medium">{text}</span>}
    </Link>
  );
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  const menuItems = [
    { icon: Home, text: "Beranda", to: "/" },
    { icon: Users, text: "Karyawan", to: "/karyawan" },
    { icon: Calculator, text: "Penggajian", to: "/penggajian" },
    { icon: FileText, text: "Laporan", to: "/laporan" },
    { icon: Calendar, text: "Kehadiran", to: "/kehadiran" },
    { icon: Settings, text: "Pengaturan", to: "/pengaturan" },
  ];

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar sticky top-0 flex flex-col border-r border-sidebar-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center h-16 px-3 border-b border-sidebar-border">
        {!isCollapsed ? (
          <h1 className="text-lg font-bold text-sidebar-foreground">Gaji Kita Selaras</h1>
        ) : (
          <h1 className="text-lg font-bold text-sidebar-foreground mx-auto">GKS</h1>
        )}
      </div>
      
      <nav className="flex-1 py-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.to}
            icon={item.icon}
            text={item.text}
            to={item.to}
            isCollapsed={isCollapsed}
            isActive={location.pathname === item.to}
          />
        ))}
      </nav>
      
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ArrowRightFromLine size={18} /> : <ArrowLeftFromLine size={18} />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
