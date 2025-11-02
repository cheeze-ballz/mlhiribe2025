"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "./supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type User = {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, handle: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        // If profile doesn't exist, create a basic one
        const supabaseUserData = await supabase.auth.getUser();
        if (supabaseUserData.data.user) {
          const email = supabaseUserData.data.user.email || "";
          const defaultName = email.split("@")[0];
          const defaultHandle = `@${defaultName}`;
          
          const { data: newProfile } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              name: defaultName,
              handle: defaultHandle,
              avatar: `https://picsum.photos/seed/${defaultName}/80`,
            })
            .select()
            .single();

          if (newProfile) {
            setUser({
              id: newProfile.id,
              name: newProfile.name,
              handle: newProfile.handle,
              avatar: newProfile.avatar,
            });
          }
        }
      } else if (data) {
        setUser({
          id: data.id,
          name: data.name,
          handle: data.handle,
          avatar: data.avatar,
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide more helpful error messages
        let errorMessage = error.message;
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Make sure email confirmation is disabled in Supabase settings if you just signed up.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email to confirm your account, or disable email confirmation in Supabase settings.";
        }
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred" };
    }
  };

  const signUp = async (email: string, password: string, name: string, handle: string) => {
    try {
      // Sign up the user with metadata for the trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            handle: handle.startsWith("@") ? handle : `@${handle}`,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // Wait a bit for the trigger to create the profile
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await loadUserProfile(authData.user.id);
        return { success: true };
      }

      return { success: false, error: "Sign up failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, signUp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

