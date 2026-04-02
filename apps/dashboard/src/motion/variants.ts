import type { Variants } from "framer-motion";

// Hero Title - Calm Authority
export const fadeSlideDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.165, 0.84, 0.44, 1] // easeOutQuart
    } 
  },
};

// KPI Strip - Confident Precision
export const fadeLift: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      delay: 0.2 + (i * 0.08), // Start after hero, stagger each
      duration: 0.45, 
      ease: "easeInOut" 
    },
  }),
};

// Security Gauge - Heartbeat of Dashboard
export const scaleInPulse: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      delay: 0.4, // After KPI strip starts
      duration: 0.8,
      ease: [0.37, 0, 0.63, 1] // easeInOutSine
    },
  },
};

// Metric Cards - Tactile Intelligence
export const cardLift: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      delay: 0.6 + (i * 0.08), // After gauge
      duration: 0.4, 
      ease: [0.075, 0.82, 0.165, 1] // easeOutCirc
    },
  }),
};

// Hover Glow - Tactile Intelligence
export const hoverGlow = {
  scale: 1.02,
  boxShadow: "0 0 25px rgba(22,119,255,0.25)",
};

// Live Threat Monitor - Continuous Pulse
export const pulseLoop: Variants = {
  animate: {
    opacity: [1, 0.85, 1],
    scale: [1, 0.99, 1],
    transition: { 
      duration: 2.5, 
      repeat: Infinity, 
      ease: [0.42, 0, 0.58, 1] 
    },
  },
};

// Charts/Analytics - Analytical Reveal
export const depthReveal: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.8, // After cards
      duration: 0.7,
      ease: [0.19, 1, 0.22, 1] // easeOutExpo
    },
  },
};

// Buttons - Responsive Immediacy  
export const springIn = {
  type: "spring" as const,
  stiffness: 140,
  damping: 14,
  delay: 1.0, // Final element
};

// Container for staggered children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.6,
    },
  },
};

// Forecast/Footer - Closing Depth
export const closingDepth: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 1.0,
      duration: 0.5,
      ease: [0.075, 0.82, 0.165, 1]
    },
  },
};
