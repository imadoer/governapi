export function Logo({
  size = 32,
  className = "",
  light = false,
}: {
  size?: number;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="4" width="40" height="40" rx="8" fill="#2563EB" />
        <path
          d="M16 24C16 19.5817 19.5817 16 24 16V16C28.4183 16 32 19.5817 32 24V24C32 28.4183 28.4183 32 24 32H16V24Z"
          fill="white"
        />
        <circle cx="24" cy="24" r="4" fill="#2563EB" />
        <path
          d="M24 16V12M24 36V32M16 24H12M36 24H32"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`text-xl font-bold ${light ? "text-white" : "text-gray-900"}`}
      >
        GovernAPI
      </span>
    </div>
  );
}
