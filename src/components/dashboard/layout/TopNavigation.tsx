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
import { Settings, User, Menu, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import { useState, useEffect } from "react";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
  notifications?: Array<{ id: string; title: string }>;
  onToggleMobileMenu?: () => void;
}

const TopNavigation = ({
  onSearch = () => {},
  notifications = [
    { id: "1", title: "New project assigned" },
    { id: "2", title: "Meeting reminder" },
  ],
  onToggleMobileMenu = () => {},
}: TopNavigationProps) => {
  const { user, userProfile, signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    <div className="w-full h-16 flex items-center px-4 sm:px-6 lg:pl-[296px] fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/50">
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

        {/* Logo/Title for mobile */}
        <div className="lg:hidden flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="School Logo"
            className="h-16 w-16 object-contain rounded"
          />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            School Admin
          </h1>
        </div>
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
              onSelect={async () => {
                try {
                  await signOut();
                } catch (error) {
                  console.error("Logout error:", error);
                  // Force redirect even if there's an error
                  window.location.href = "/login";
                }
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavigation;