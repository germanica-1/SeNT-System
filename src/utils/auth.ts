import { supabase } from "../../supabase/supabase";

/**
 * Validates if the current user has admin access
 * @returns Promise<boolean> - true if user is authenticated admin
 */
export const validateAdminAccess = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Admin access validation failed:", error);
      return false;
    }

    // Check if user exists in users table (admin verification)
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (adminError || !adminUser) {
      console.error("User not found in admin users table:", adminError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating admin access:", error);
    return false;
  }
};

/**
 * Securely resets an admin's password using Supabase Edge Function
 * @param adminId - The ID of the admin whose password to reset
 * @param newPassword - The new password
 * @returns Promise<{ success: boolean; error?: string }>
 */
export const resetAdminPassword = async (
  adminId: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate current user has admin access
    const hasAccess = await validateAdminAccess();
    if (!hasAccess) {
      return {
        success: false,
        error: "Unauthorized: Only authenticated admins can reset passwords",
      };
    }

    // Validate password strength
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long",
      };
    }

    // Call the edge function to reset the password
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-reset-admin-password",
      {
        body: {
          adminId,
          newPassword,
        },
      },
    );

    if (error) {
      console.error("Password reset error:", error);
      return {
        success: false,
        error: error.message || "Failed to reset password",
      };
    }

    if (data?.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error in resetAdminPassword:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
};

/**
 * Generates a secure random password
 * @param length - Length of the password (default: 12)
 * @returns string - Generated password
 */
export const generateSecurePassword = (length: number = 12): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one character from each category
  const categories = [
    "abcdefghijklmnopqrstuvwxyz", // lowercase
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ", // uppercase
    "0123456789", // numbers
    "!@#$%^&*", // special characters
  ];

  // Add one character from each category
  categories.forEach((category) => {
    password += category.charAt(Math.floor(Math.random() * category.length));
  });

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};
