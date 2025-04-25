/* src/components/layout/Layout.tsx */
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Hoed Payroll System. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link to="/privacy-policy" className="text-sm hover:underline">Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-sm hover:underline">Terms of Service</Link>
            <Link to="/contact" className="text-sm hover:underline">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}