"use client";

export function DependencyMap() {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">API Dependency Map</h3>
      <div className="text-center py-10">
        <svg width="400" height="200" viewBox="0 0 400 200" className="mx-auto">
          <circle cx="100" cy="100" r="30" fill="#06b6d4" />
          <text x="100" y="105" textAnchor="middle" fill="white" fontSize="10">
            User API
          </text>

          <circle cx="300" cy="60" r="25" fill="#10b981" />
          <text x="300" y="65" textAnchor="middle" fill="white" fontSize="9">
            Auth API
          </text>

          <circle cx="300" cy="140" r="25" fill="#f59e0b" />
          <text x="300" y="145" textAnchor="middle" fill="white" fontSize="9">
            Payment
          </text>

          <line x1="130" y1="85" x2="275" y2="65" stroke="#444" strokeWidth="2" />
          <line x1="130" y1="115" x2="275" y2="135" stroke="#444" strokeWidth="2" />

          <polygon points="275,63 270,60 270,66" fill="#444" />
          <polygon points="275,137 270,134 270,140" fill="#444" />
        </svg>
        <p className="mt-5 text-gray-500">
          Interactive dependency mapping coming soon
        </p>
      </div>
    </div>
  );
}
