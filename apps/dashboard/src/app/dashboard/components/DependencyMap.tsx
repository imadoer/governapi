"use client";

import { Card } from "antd";

export function DependencyMap() {
  return (
    <Card title="API Dependency Map">
      <div style={{ textAlign: "center", padding: "40px" }}>
        <svg width="400" height="200" viewBox="0 0 400 200">
          <circle cx="100" cy="100" r="30" fill="#1890ff" />
          <text x="100" y="105" textAnchor="middle" fill="white" fontSize="10">
            User API
          </text>

          <circle cx="300" cy="60" r="25" fill="#52c41a" />
          <text x="300" y="65" textAnchor="middle" fill="white" fontSize="9">
            Auth API
          </text>

          <circle cx="300" cy="140" r="25" fill="#fa8c16" />
          <text x="300" y="145" textAnchor="middle" fill="white" fontSize="9">
            Payment
          </text>

          <line
            x1="130"
            y1="85"
            x2="275"
            y2="65"
            stroke="#ccc"
            strokeWidth="2"
          />
          <line
            x1="130"
            y1="115"
            x2="275"
            y2="135"
            stroke="#ccc"
            strokeWidth="2"
          />

          <polygon points="275,63 270,60 270,66" fill="#ccc" />
          <polygon points="275,137 270,134 270,140" fill="#ccc" />
        </svg>
        <p style={{ marginTop: "20px", color: "#666" }}>
          Interactive dependency mapping coming soon
        </p>
      </div>
    </Card>
  );
}
