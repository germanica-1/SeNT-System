import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Home, Calendar, Users, Settings, Shield } from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isActive?: boolean;
}

interface SidebarProps {
  items?: NavItem[];
  activeItem?: string;
  onItemClick?: (label: string) => void;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

const defaultNavItems: NavItem[] = [
  { icon: <Users size={24} />, label: "Student Management", isActive: true },
  { icon: <Calendar size={24} />, label: "Attendance Logs" },
  { icon: <Home size={24} />, label: "Emergency Alerts" },
  { icon: <Shield size={24} />, label: "Add Admin" },
];

const Sidebar = ({
  items = defaultNavItems,
  activeItem = "Home",
  onItemClick = () => {},
  isMobileMenuOpen = false,
  onCloseMobileMenu = () => {},
}: SidebarProps) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[280px] h-screen bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border-r border-gray-200 dark:border-gray-700/50 flex-col fixed left-0 top-0 z-50">
        <div className="p-6 pt-5">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/logo.jpg"
              alt="School Logo"
              className="h-16 w-16 object-contain rounded-lg"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                School Management
              </h2>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            School Attendance Management
          </p>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          <div className="space-y-1.5">
            {items.map((item) => (
              <Button
                key={item.label}
                variant={"ghost"}
                className={`w-full justify-start gap-4 h-12 rounded-xl text-base font-medium ${item.label === activeItem ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                onClick={() => onItemClick(item.label)}
              >
                <span
                  className={`${item.label === activeItem ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] w-[280px] bg-white/95 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-700/50 flex flex-col z-[100] transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ pointerEvents: isMobileMenuOpen ? "auto" : "none" }}
      >
        <div className="p-4 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/logo.jpg"
              alt="School Logo"
              className="h-16 w-16 object-contain rounded-lg"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                School Management
              </h2>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            School Attendance Management
          </p>
        </div>

        <ScrollArea className="flex-1 px-3 pb-4">
          <div className="space-y-1.5">
            {items.map((item) => (
              <Button
                key={item.label}
                variant={"ghost"}
                className={`w-full justify-start gap-4 h-12 rounded-xl text-base font-medium ${item.label === activeItem ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                onClick={() => onItemClick(item.label)}
              >
                <span
                  className={`${item.label === activeItem ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default Sidebar;
