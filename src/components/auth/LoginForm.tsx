import { useState, useEffect } from "react";
import { useAuth } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const banners = [
    "/banner1.jpg",
    "/banner2.jpg",
    "/banner3.jpg",
    "/banner4.jpg",
  ];

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      await signIn(email.trim(), password);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Banner Slideshow */}
      <div className="absolute inset-0 z-0">
        {banners.map((banner, index) => (
          <div
            key={banner}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentBanner ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={banner}
              alt={`School banner ${index + 1}`}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
          </div>
        ))}
      </div>

      <div className="bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="School Logo"
              className="h-24 w-24 object-contain rounded-lg"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            School Attendance System
          </h2>
          <p className="text-sm text-gray-500">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-lg border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm"
          >
            Sign in to Dashboard
          </Button>
        </form>
      </div>
    </div>
  );
}
