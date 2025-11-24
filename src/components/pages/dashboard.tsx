import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import DashboardGrid from "../dashboard/DashboardGrid";
import { LoadingSpinner } from "../ui/loading-spinner";
import { cn } from "@/lib/utils";

// Lazy load heavy components to improve initial load time
const StudentManagement = lazy(() => import("../dashboard/StudentManagement"));
const AttendanceLogs = lazy(() => import("../dashboard/AttendanceLogs"));

const EmergencyNotification = lazy(
  () => import("../dashboard/EmergencyNotification"),
);
const AddAdmin = lazy(() => import("../dashboard/AddAdmin"));

const Home = () => {
  const [activeView, setActiveView] = useState("Attendance Logs");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(
    new Set(),
  );

  const handleSidebarItemClick = (label: string) => {
    setActiveView(label);
    setIsMobileMenuOpen(false); // Close mobile menu when item is selected

    // Mark component as loaded to prevent re-mounting
    setLoadedComponents((prev) => new Set([...prev, label]));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Memoize component rendering to prevent unnecessary re-renders
  const renderActiveComponent = useMemo(() => {
    const componentProps = {
      isVisible: true,
      isSidebarCollapsed,
    };

    switch (activeView) {
      case "Student Management":
        return <StudentManagement key={activeView} {...componentProps} />;
      case "Attendance Logs":
        return <AttendanceLogs key={activeView} {...componentProps} />;

      case "Emergency Alerts":
        return <EmergencyNotification key={activeView} {...componentProps} />;
      case "Add Admin":
        return <AddAdmin key={activeView} {...componentProps} />;
      default:
        return <AttendanceLogs key={activeView} {...componentProps} />;
    }
  }, [activeView]);

  // Animation variants for page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-gray-950">
      <TopNavigation 
        onToggleMobileMenu={toggleMobileMenu}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <div className="flex h-screen">
        <Sidebar
          activeItem={activeView}
          onItemClick={handleSidebarItemClick}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          onCollapsedChange={setIsSidebarCollapsed}
        />
        <motion.main
          className={`flex-1 overflow-auto pt-16 w-full max-w-full transition-all duration-300 ${
            isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[280px]'
          }`}
        >
          <div
            className={cn(
              "w-full max-w-full p-4 sm:p-6 space-y-6 sm:space-y-8",
              "transition-all duration-300 ease-in-out",
              isSidebarCollapsed ? "mx-auto max-w-7xl" : ""
            )}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner text="Loading component..." />
                </div>
              }
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {renderActiveComponent}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </div>
        </motion.main>
      </div>
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-60 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
