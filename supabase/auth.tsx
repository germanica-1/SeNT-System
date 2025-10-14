import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Database } from "../src/types/supabase";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const initializationRef = useRef(false);
  const authListenerRef = useRef<any>(null);

  const refreshUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setUserProfile(null);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserProfile(profile || null);
    } catch (error) {
      console.error("Error refreshing user profile:", error);
      setUserProfile(null);
    }
  };

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        // Get existing session without clearing it
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setUser(session?.user || null);

        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
            setUserProfile(profile || null);
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Auth state listener
  useEffect(() => {
    if (!initialized || authListenerRef.current) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.id);

      // Handle sign out events
      if (event === "SIGNED_OUT" || !session) {
        console.log("User signed out, clearing state");
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Handle sign in and token refresh events
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        console.log("User signed in or token refreshed");
        setUser(session.user);
        setLoading(false);

        // Fetch profile asynchronously without blocking
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
            setUserProfile(profile || null);
          } catch (error) {
            console.error("Error fetching profile:", error);
            setUserProfile(null);
          }
        }, 0);
      }
    });

    authListenerRef.current = subscription;
    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [initialized]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: undefined,
      },
    });

    if (error) throw error;

    if (data.user) {
      // Create user profile in database
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email || email,
        full_name: fullName,
        token_identifier: data.user.id,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Error inserting user profile:", insertError);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        throw new Error(
          "Invalid email or password. Please check your credentials.",
        );
      } else if (error.message.includes("Too many requests")) {
        throw new Error(
          "Too many login attempts. Please wait a moment and try again.",
        );
      } else {
        throw new Error(error.message || "Login failed. Please try again.");
      }
    }

    if (!data.user) {
      throw new Error("Login failed. No user data received.");
    }

    // Update user profile with latest login info
    const { error: updateError } = await supabase.from("users").upsert(
      {
        id: data.user.id,
        email: data.user.email || email,
        full_name: data.user.user_metadata?.full_name || null,
        token_identifier: data.user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    if (updateError) {
      console.error("Error updating user profile on login:", updateError);
    }

    return data;
  };

  const signOut = async () => {
    try {
      console.log("Starting sign out process...");

      // Immediately clear state to prevent any auth checks
      setUser(null);
      setUserProfile(null);
      setLoading(true);

      // Unsubscribe from auth listener first to prevent interference
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }

      // Reset initialization flags
      initializationRef.current = false;
      setInitialized(false);

      // Sign out from Supabase first
      await supabase.auth.signOut({ scope: "local" });

      // Clear all auth-related storage after signOut
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("supabase.auth")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear session storage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("supabase.auth")) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

      // Final state clear
      setLoading(false);

      console.log("Sign out completed, redirecting to login...");

      // Use window.location.href for a clean redirect
      window.location.href = "/login";
    } catch (error) {
      console.error("Sign out error:", error);

      // Force clear everything on error
      setUser(null);
      setUserProfile(null);
      setLoading(false);

      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }

      // Clear all auth-related storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("supabase.auth")) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("supabase.auth")) {
          sessionStorage.removeItem(key);
        }
      });

      // Reset flags
      initializationRef.current = false;
      setInitialized(false);

      // Force redirect even on error
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
