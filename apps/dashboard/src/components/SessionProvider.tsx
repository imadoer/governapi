"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: {
    company_name: string;
    subscription_plan: string;
    subscription_status: string;
  } | null;
  apiKey: string;
}

interface AuthContextType {
  user: User | null;
  apiKey: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on the client side before accessing sessionStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const storedApiKey = sessionStorage.getItem("apiKey");
          const storedUser = sessionStorage.getItem("user");

          if (storedApiKey && storedUser) {
            setApiKey(storedApiKey);
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [mounted]);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Login failed");
    }

    const { user: userData } = result;
    setUser(userData);
    setApiKey(userData.apiKey);

    // Store in session for persistence
    if (typeof window !== "undefined") {
      sessionStorage.setItem("apiKey", userData.apiKey);
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    setApiKey(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("apiKey");
      sessionStorage.removeItem("user");
    }
  };

  // Don't render auth context until mounted on client
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        apiKey,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!apiKey,
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
