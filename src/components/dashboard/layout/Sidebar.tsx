import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Home, Calendar, Users, Settings, Shield, ChevronRight } from "lucide-react";

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
  onCollapsedChange?: (collapsed: boolean) => void;
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
  onCollapsedChange = () => {},
}: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-expand on hover near left edge
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 1024) { // Only on desktop
        if (e.clientX <= 20 && isCollapsed) {
          setIsHovering(true);
        } else if (e.clientX > 300) {
          setIsHovering(false);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isCollapsed]);

  // Notify parent when collapsed state changes
  useEffect(() => {
    onCollapsedChange(isCollapsed && !isHovering);
  }, [isCollapsed, isHovering, onCollapsedChange]);

  const shouldShowSidebar = !isCollapsed || isHovering;

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: shouldShowSidebar ? 280 : 0,
          opacity: shouldShowSidebar ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="hidden lg:flex h-screen bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border-r border-gray-200 dark:border-gray-700/50 flex-col fixed left-0 top-0 z-50 overflow-hidden"
      >
        <motion.div
          animate={{ opacity: shouldShowSidebar ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-6 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
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
              {items.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Button
                    variant={"ghost"}
                    className={`w-full justify-start gap-4 h-12 rounded-xl text-base font-medium transition-all duration-200 ${item.label === activeItem ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    onClick={() => onItemClick(item.label)}
                  >
                    <span
                      className={`${item.label === activeItem ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Button>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>

      {/* Collapse Toggle Button */}
      <motion.button
        initial={false}
        animate={{
          left: shouldShowSidebar ? 280 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex fixed top-20 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-md"
      >
        <motion.div
          animate={{ rotate: shouldShowSidebar ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] w-[280px] bg-white/95 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-700/50 flex flex-col z-[100]"
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
                {items.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Button
                      variant={"ghost"}
                      className={`w-full justify-start gap-4 h-12 rounded-xl text-base font-medium transition-all duration-200 ${item.label === activeItem ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                      onClick={() => onItemClick(item.label)}
                    >
                      <span
                        className={`${item.label === activeItem ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
