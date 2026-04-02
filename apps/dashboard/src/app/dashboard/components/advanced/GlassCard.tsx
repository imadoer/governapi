import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  const Component = hover ? motion.div : 'div';
  
  return (
    <Component
      {...(hover ? { whileHover: { y: -2 } } : {})}
      className={`glass-card ${className}`}
    >
      {children}
      <style jsx>{`
        .glass-card {
          background: rgba(20, 25, 40, 0.65);
          backdrop-filter: blur(20px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.04);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 18px rgba(0,0,0,0.35);
          border-radius: 1rem;
          position: relative;
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .glass-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent);
          opacity: 0.6;
        }
        .glass-card:hover {
          border-color: rgba(6,182,212,0.15);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 28px rgba(0,0,0,0.45);
        }
      `}</style>
    </Component>
  );
}
