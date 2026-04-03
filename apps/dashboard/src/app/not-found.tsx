"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow orb behind 404 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-[10rem] md:text-[14rem] font-black leading-none bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent select-none">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-400 mb-10 text-lg max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              <HomeIcon className="w-5 h-5" />
              Go Home
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] text-white font-semibold rounded-xl hover:border-cyan-500/30 transition-all"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
