import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Menu, Moon, Sun, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
  notifications?: Array<{ id: string; title: string }>;
  onToggleMobileMenu?: () => void;
  isSidebarCollapsed?: boolean;
}

const TopNavigation = ({
  onSearch = () => {},
  notifications = [
    { id: "1", title: "New project assigned" },
    { id: "2", title: "Meeting reminder" },
  ],
  onToggleMobileMenu = () => {},
  isSidebarCollapsed = false,
}: TopNavigationProps) => {
  const { user, userProfile, signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Show default user info if no user is authenticated
  const displayUser = user || { email: "admin@schoolattend.com" };

  // Get the display name from user profile, user metadata, or fallback to email
  const displayName =
    userProfile?.full_name ||
    userProfile?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "admin@schoolattend.com";

  // Check for saved theme preference or default to light mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      // Default to light mode regardless of system preference
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <div className={`w-full max-w-full h-16 flex items-center px-4 sm:px-6 fixed top-0 z-50 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/50 transition-all duration-500 ${
      isSidebarCollapsed ? 'left-0' : 'left-0 lg:left-[280px]'
    } ${
      isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      <div className="flex items-center gap-4">
        {/* Mobile hamburger menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onToggleMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo/Title for mobile and when sidebar is collapsed */}
        <div className="lg:hidden flex items-center gap-3">
          <img
            src="/logo.png"
            alt="School Logo"
            className="h-16 w-16 object-contain rounded"
          />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            School Admin
          </h1>
        </div>

        {/* Logo/Title for desktop when sidebar is collapsed */}
        <AnimatePresence>
          {isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="hidden lg:flex items-center gap-3"
            >
              <img
                src="/logo.png"
                alt="School Logo"
                className="h-12 w-12 object-contain rounded-lg"
              />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  School Management
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Attendance System
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dark Mode Toggle and Profile Avatar */}
      <div className="ml-auto flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={displayName} />
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-none shadow-lg bg-white dark:bg-gray-800 w-56"
          >
            <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400">
              {displayName}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer flex items-center justify-between">
              <div className="flex items-center">
                <Sun className="mr-2 h-4 w-4" />
                Dark Mode
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className="data-[state=checked]:bg-blue-600"
              />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              disabled={isLoggingOut}
              onSelect={async () => {
                try {
                  setIsLoggingOut(true);
                  setIsTransitioning(true);
                  
                  // Wait for transition animation
                  await new Promise(resolve => setTimeout(resolve, 400));
                  
                  await signOut();
                } catch (error) {
                  console.error("Logout error:", error);
                  // Force redirect even if there's an error
                  window.location.href = "/login";
                }
              }}
            >
              {isLoggingOut ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="animate-pulse">Logging out...</span>
                </span>
              ) : (
                'Log out'
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavigation;