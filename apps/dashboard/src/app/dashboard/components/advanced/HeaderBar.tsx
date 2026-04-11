"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  BellSlashIcon,
} from "@heroicons/react/24/outline";

interface HeaderBarProps {
  user: any;
  company: any;
  onLogout: () => void;
  onRefresh: () => void;
  onNavigate?: (page: string) => void;
}

export function HeaderBar({
  user,
  company,
  onLogout,
  onRefresh,
  onNavigate,
}: HeaderBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; read: boolean }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") : null;
    if (token) {
      fetch("/api/customer/alerts", { headers: { "Authorization": `Bearer ${token}` }, credentials: "include" })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.alerts)) {
            setNotifications(d.alerts.slice(0, 8).map((a: any, i: number) => ({
              id: a.id || String(i),
              text: a.message || a.title || a.alert_type || "Alert",
              time: a.created_at ? new Date(a.created_at).toLocaleDateString() : "",
              read: a.read ?? a.acknowledged ?? false,
            })));
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    if (onNavigate) onNavigate("settings");
  };

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    onLogout();
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-30 border-b border-white/10 backdrop-blur-xl bg-black/20"
    >
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <motion.h1
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              GovernAPI
            </motion.h1>
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm text-green-400 font-semibold">
                All Systems Operational
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {(() => {
              const p = company?.subscriptionPlan || "free";
              const cfg: Record<string, { bg: string; text: string; label: string }> = {
                free: { bg: "bg-gray-700", text: "text-gray-300", label: "FREE PLAN" },
                starter: { bg: "bg-blue-500/20", text: "text-blue-400", label: "STARTER PLAN" },
                professional: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "PROFESSIONAL" },
                enterprise: { bg: "bg-cyan-500", text: "text-white", label: "ENTERPRISE" },
              };
              const c = cfg[p] || cfg.free;
              return (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-full ${c.bg} ${c.text} text-[11px] font-bold`}>
                    {c.label}
                  </div>
                  {p === "free" && onNavigate && (
                    <button onClick={() => onNavigate("billing-subscription")} className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                      Upgrade
                    </button>
                  )}
                </div>
              );
            })()}

            <div className="relative" ref={bellRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <BellIcon className="w-5 h-5 text-gray-400" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <motion.span
                    className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              <AnimatePresence>
                {bellOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="text-sm font-semibold text-white">Notifications</div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${n.read ? "opacity-60" : ""}`}>
                            <div className="text-[13px] text-slate-300">{n.text}</div>
                            {n.time && <div className="text-[11px] text-slate-600 mt-0.5">{n.time}</div>}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <BellSlashIcon className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                          <p className="text-[13px] text-slate-500">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={onRefresh}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-400" />
            </motion.button>

            {/* User dropdown */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center cursor-pointer"
              >
                {initials}
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="font-semibold text-white">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-xs text-slate-400">{user?.email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{company?.companyName}</div>
                    </div>
                    <div className="py-1">
                      <button
                        onMouseDown={(e) => { e.stopPropagation(); handleSettingsClick(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onMouseDown={(e) => { e.stopPropagation(); handleLogoutClick(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
