import React from 'react'

export default function Logo({ size = 32, className = '' }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(255,69,0,0.45)]"
      >
        <defs>
          {/* Background Shield Gradient */}
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2330" />
            <stop offset="50%" stopColor="#0F141F" />
            <stop offset="100%" stopColor="#080C14" />
          </linearGradient>

          {/* Border Glow Gradient */}
          <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="50%" stopColor="#FF3838" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Outer Flame Gradient */}
          <linearGradient id="flameOuterGrad" x1="50%" y1="10%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFF176" />
            <stop offset="25%" stopColor="#FF8F00" />
            <stop offset="70%" stopColor="#FF3D00" />
            <stop offset="100%" stopColor="#D50000" />
          </linearGradient>

          {/* Inner Core Gradient */}
          <linearGradient id="flameInnerGrad" x1="50%" y1="20%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FFF59D" />
            <stop offset="70%" stopColor="#FF9100" />
            <stop offset="100%" stopColor="#FF3D00" />
          </linearGradient>

          {/* Satellite Orbit Gradient */}
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF8F00" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Outer Rounded Container */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill="url(#shieldGrad)"
          stroke="url(#borderGrad)"
          strokeWidth="1.5"
        />

        {/* Satellite Orbital Trajectory Ring */}
        <ellipse
          cx="32"
          cy="32"
          rx="25"
          ry="11"
          transform="rotate(-28 32 32)"
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="1.25"
          strokeDasharray="4 2.5"
        />

        {/* Satellite Nodes on Orbit */}
        {/* Node 1: VIIRS (Cyan) */}
        <circle cx="51" cy="22" r="2.2" fill="#38BDF8" />
        <circle cx="51" cy="22" r="3.8" fill="#38BDF8" fillOpacity="0.3" />

        {/* Node 2: MODIS (Gold) */}
        <circle cx="13" cy="42" r="2.2" fill="#FFB703" />
        <circle cx="13" cy="42" r="3.8" fill="#FFB703" fillOpacity="0.3" />

        {/* Harmonized Heat Flux Waves (Subtle Grid Traces) */}
        <path
          d="M20 46 C24 49, 40 49, 44 46"
          stroke="#FF5722"
          strokeWidth="1"
          strokeOpacity="0.3"
          strokeLinecap="round"
        />

        {/* Dynamic Stylized Flame Body */}
        <path
          d="M32 13 
             C35 21, 44 26, 44 36 
             C44 44, 38.5 50, 32 50 
             C25.5 50, 20 44, 20 36 
             C20 27, 28 20, 32 13 Z"
          fill="url(#flameOuterGrad)"
        />

        {/* Inner Radiant Thermal Flame Core */}
        <path
          d="M32 25 
             C34 29, 39 33, 39 39 
             C39 44, 35.8 47.5, 32 47.5 
             C28.2 47.5, 25 44, 25 39 
             C25 33, 29.5 29, 32 25 Z"
          fill="url(#flameInnerGrad)"
        />

        {/* Harmonization Convergence Spark / Star */}
        <polygon
          points="32,32 33.5,35 36.5,36.5 33.5,38 32,41 30.5,38 27.5,36.5 30.5,35"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  )
}

