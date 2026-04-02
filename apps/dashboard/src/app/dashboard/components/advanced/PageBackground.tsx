import React from 'react';

interface PageBackgroundProps {
  children: React.ReactNode;
}

export function PageBackground({ children }: PageBackgroundProps) {
  return (
    <div 
      className="min-h-screen w-full p-0"
      style={{
        background: 'radial-gradient(120% 120% at 60% 30%, #0B1228 0%, #10172C 60%, #0A0F1E 100%)',
        position: 'relative',
      }}
    >
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(22,119,255,0.04) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
