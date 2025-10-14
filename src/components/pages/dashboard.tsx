import React, { useState, useEffect, Suspense, lazy, useMemo } from "react";
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

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-gray-950">
      <TopNavigation onToggleMobileMenu={toggleMobileMenu} />
      <div className="flex h-screen">
        <Sidebar
          activeItem={activeView}
          onItemClick={handleSidebarItemClick}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-auto lg:ml-[280px] pt-16">
          <div
            className={cn(
              "container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8",
              "transition-all duration-300 ease-in-out",
            )}
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <LoadingSpinner text="Loading component..." />
                </div>
              }
            >
              {renderActiveComponent}
            </Suspense>
          </div>
        </main>
      </div>
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black dark:bg-black bg-opacity-50 dark:bg-opacity-60 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;
