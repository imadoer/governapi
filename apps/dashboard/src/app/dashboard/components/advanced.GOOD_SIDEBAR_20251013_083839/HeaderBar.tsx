"use client";

import { motion } from "framer-motion";
import {
  BellIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Avatar, Dropdown, Badge } from "antd";

interface HeaderBarProps {
  user: any;
  company: any;
  onLogout: () => void;
  onRefresh: () => void;
}

export function HeaderBar({
  user,
  company,
  onLogout,
  onRefresh,
}: HeaderBarProps) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b border-white/10 backdrop-blur-xl bg-black/20"
    >
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <motion.h1
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent"
              whileHover={{ scale: 1.05 }}
            >
              🛡️ GovernAPI
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 rounded-full bg-cyan-500 text-white text-sm font-bold"
            >
              PROFESSIONAL PLAN
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <BellIcon className="w-5 h-5 text-gray-400" />
              <motion.span
                className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>

            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              onClick={onRefresh}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-400" />
            </motion.button>

            <Dropdown
              menu={{
                items: [
                  {
                    key: "1",
                    label: (
                      <div>
                        <div className="font-bold text-white">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user?.email}
                        </div>
                      </div>
                    ),
                    disabled: true,
                  },
                  {
                    key: "2",
                    label: (
                      <span className="text-gray-400">
                        {company?.companyName}
                      </span>
                    ),
                    disabled: true,
                  },
                  { type: "divider" },
                  {
                    key: "3",
                    icon: <Cog6ToothIcon className="w-4 h-4" />,
                    label: "Settings",
                  },
                  {
                    key: "4",
                    label: "Logout",
                    onClick: onLogout,
                    danger: true,
                  },
                ],
              }}
            >
              <motion.div whileHover={{ scale: 1.1 }}>
                <Avatar
                  size={40}
                  className="cursor-pointer bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold"
                >
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Avatar>
              </motion.div>
            </Dropdown>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
