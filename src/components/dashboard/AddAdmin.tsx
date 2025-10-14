import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  Trash2,
  Users,
  Key,
} from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { cn } from "@/lib/utils";
import { resetAdminPassword } from "@/utils/auth";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface AddAdminProps {
  isVisible?: boolean;
}

interface Admin {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

const AddAdmin = ({ isVisible = true }: AddAdminProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState<Admin | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordResetData, setPasswordResetData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordResetErrors, setPasswordResetErrors] = useState<
    Record<string, string>
  >({});

  const { signUp, refreshUser } = useAuth();
  const { toast } = useToast();

  // Fetch all admins from the users table
  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoadingAdmins(true);
      console.log("Fetching all admins from users table...");

      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching admins:", error);
        toast({
          title: "Error Loading Admins",
          description: "Failed to load admin list. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      console.log("Fetched admins:", data);
      console.log("Number of admins found:", data?.length || 0);
      setAdmins(data || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Error Loading Admins",
        description: "Failed to load admin list. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAdmins(false);
    }
  }, [toast]);

  // Handle real-time updates for the users table
  const handleRealtimeUpdate = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      console.log("Real-time update received:", payload);

      switch (payload.eventType) {
        case "INSERT":
          if (payload.new) {
            const newAdmin = payload.new as Admin;
            console.log("Adding new admin:", newAdmin);
            setAdmins((prev) => {
              // Check if admin already exists to prevent duplicates
              const exists = prev.some((admin) => admin.id === newAdmin.id);
              if (!exists) {
                console.log("Admin added to list");
                return [newAdmin, ...prev];
              }
              console.log("Admin already exists, skipping");
              return prev;
            });
          }
          break;
        case "UPDATE":
          if (payload.new) {
            const updatedAdmin = payload.new as Admin;
            console.log("Updating admin:", updatedAdmin);
            setAdmins((prev) =>
              prev.map((admin) => {
                if (admin.id === updatedAdmin.id) {
                  console.log("Admin updated in list");
                  return updatedAdmin;
                }
                return admin;
              }),
            );
          }
          break;
        case "DELETE":
          if (payload.old) {
            const deletedAdmin = payload.old as Admin;
            console.log("Deleting admin:", deletedAdmin);
            setAdmins((prev) => {
              const filtered = prev.filter(
                (admin) => admin.id !== deletedAdmin.id,
              );
              console.log("Admin removed from list");
              return filtered;
            });
          }
          break;
      }
    },
    [],
  );

  // Load admins on component mount and set up real-time subscription
  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    const initializeComponent = async () => {
      if (!isMounted) return;

      // Fetch initial data
      await fetchAdmins();

      if (!isMounted) return;

      // Set up real-time subscription for the users table
      subscription = supabase
        .channel(`admin-users-changes-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "users",
          },
          (payload) => {
            if (isMounted) {
              handleRealtimeUpdate(payload);
            }
          },
        )
        .subscribe((status) => {
          console.log("Real-time subscription status:", status);
          if (status === "SUBSCRIBED") {
            console.log("Successfully subscribed to users table changes");
          } else if (status === "CHANNEL_ERROR") {
            console.error("Failed to subscribe to users table changes");
          }
        });

      console.log("Real-time subscription set up for users table");
    };

    initializeComponent();

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      console.log("Cleaning up real-time subscription");
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchAdmins, handleRealtimeUpdate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.name);

      toast({
        title: "Admin Created Successfully",
        description: `Super Admin account for ${formData.name} has been created.`,
      });

      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
      setIsOpen(false);
      // Refresh the admin list to ensure we have the latest data
      await fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error Creating Admin",
        description:
          error.message || "Failed to create admin account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    try {
      // Use the edge function to properly delete admin from both auth and users table
      const { data, error } = await supabase.functions.invoke('supabase-functions-delete-admin', {
        body: { adminId },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Admin Deleted Successfully",
        description: `Admin account for ${adminName} has been completely removed.`,
      });

      // Refresh the admin list to ensure we have the latest data
      await fetchAdmins();
    } catch (error: any) {
      toast({
        title: "Error Deleting Admin",
        description:
          error.message || "Failed to delete admin account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = (admin: Admin) => {
    setResetPasswordAdmin(admin);
    setPasswordResetData({
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordResetErrors({});
    setIsPasswordResetOpen(true);
  };

  const validatePasswordResetForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordResetData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordResetData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordResetData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm the new password";
    } else if (
      passwordResetData.newPassword !== passwordResetData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordResetErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordResetInputChange = (field: string, value: string) => {
    setPasswordResetData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (passwordResetErrors[field]) {
      setPasswordResetErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordResetForm() || !resetPasswordAdmin) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetAdminPassword(
        resetPasswordAdmin.id,
        passwordResetData.newPassword,
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to reset password");
      }

      toast({
        title: "Password Reset Successfully",
        description: `Password for ${resetPasswordAdmin.full_name || resetPasswordAdmin.email} has been updated.`,
      });

      setPasswordResetData({ newPassword: "", confirmPassword: "" });
      setPasswordResetErrors({});
      setIsPasswordResetOpen(false);
      setResetPasswordAdmin(null);
    } catch (error: any) {
      toast({
        title: "Error Resetting Password",
        description:
          error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="space-y-6">
      {/* Add Admin Card */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Admin Management
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Create and manage administrator accounts for the school attendance
              system
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Create Super Admin
                </DialogTitle>
                <DialogDescription>
                  Create a new administrator account with full system access.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter admin's full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className={cn(
                      errors.name &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter admin's email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={cn(
                      errors.email &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={cn(
                        "pr-10",
                        errors.password &&
                          "border-red-500 focus-visible:ring-red-500",
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className={cn(
                        "pr-10",
                        errors.confirmPassword &&
                          "border-red-500 focus-visible:ring-red-500",
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Role Display */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Role: Super Admin
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Full access to all system features and settings
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Admin"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Super Admin Privileges
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Manage student records</li>
              <li>• View and export attendance logs</li>
              <li>• Configure school schedules</li>
              <li>• Send emergency notifications</li>
              <li>• Create additional admin accounts</li>
            </ul>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              Admin Requirements
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Valid email address required</li>
              <li>• Strong password (min 6 characters)</li>
              <li>• Password must be confirmed</li>
              <li>• Full name for identification</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Admin Management Table */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 sm:p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Registered Admins
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Manage existing administrator accounts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Users className="h-4 w-4" />
            <span>
              {admins.length} Admin{admins.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Admin Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAdmins ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading admin accounts...
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    No admin accounts found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="font-medium">
                          {admin.full_name || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{admin.email}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Super Admin
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Active
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePasswordReset(admin)}
                          className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                              title="Delete Admin"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Admin Account
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the admin
                                account for{" "}
                                <strong>
                                  {admin.full_name || admin.email}
                                </strong>
                                ? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteAdmin(
                                    admin.id,
                                    admin.full_name || admin.email,
                                  )
                                }
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Reset Admin Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for{" "}
              <strong>
                {resetPasswordAdmin?.full_name || resetPasswordAdmin?.email}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPasswordReset} className="space-y-4">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwordResetData.newPassword}
                  onChange={(e) =>
                    handlePasswordResetInputChange(
                      "newPassword",
                      e.target.value,
                    )
                  }
                  className={cn(
                    "pr-10",
                    passwordResetErrors.newPassword &&
                      "border-red-500 focus-visible:ring-red-500",
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {passwordResetErrors.newPassword && (
                <p className="text-sm text-red-500">
                  {passwordResetErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm new password"
                value={passwordResetData.confirmPassword}
                onChange={(e) =>
                  handlePasswordResetInputChange(
                    "confirmPassword",
                    e.target.value,
                  )
                }
                className={cn(
                  passwordResetErrors.confirmPassword &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
              />
              {passwordResetErrors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {passwordResetErrors.confirmPassword}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordResetOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddAdmin;