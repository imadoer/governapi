"use client";

export function PolicyManagement() {
  const policies = [
    { key: 1, name: "Rate Limiting Policy", status: "active", type: "Rate Control", requests: "1,247", blocked: 23, effectiveness: 98 },
    { key: 2, name: "Authentication Required", status: "active", type: "Security", requests: "892", blocked: 45, effectiveness: 95 },
    { key: 3, name: "CORS Policy", status: "active", type: "Access Control", requests: "2,156", blocked: 12, effectiveness: 99 },
    { key: 4, name: "Data Validation", status: "inactive", type: "Input Validation", requests: "0", blocked: 0, effectiveness: 0 },
  ];

  const policyTemplates = [
    { name: "PCI DSS Compliance", description: "Payment card industry security standards" },
    { name: "GDPR Data Protection", description: "European data privacy regulations" },
    { name: "SOC2 Controls", description: "Service organization control standards" },
    { name: "API Rate Limiting", description: "Prevent API abuse and DoS attacks" },
  ];

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="text-sm text-gray-400 mb-1">Active Policies</div>
          <div className="text-2xl font-bold text-white">3</div>
        </div>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="text-sm text-gray-400 mb-1">Requests Protected</div>
          <div className="text-2xl font-bold text-white">4,295</div>
        </div>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="text-sm text-gray-400 mb-1">Policies Active</div>
          <div className="text-2xl font-bold text-white">80</div>
        </div>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="text-sm text-gray-400 mb-1">Avg Effectiveness</div>
          <div className="text-2xl font-bold text-white">97%</div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Security Policies</h3>
          <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
            + Create Policy
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Policy Name</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Status</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Type</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Requests Processed</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Blocked</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Effectiveness</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.key} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3 text-white">{policy.name}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${policy.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {policy.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-300">{policy.type}</td>
                  <td className="py-2 px-3 text-gray-300">{policy.requests}</td>
                  <td className="py-2 px-3 text-gray-300">{policy.blocked}</td>
                  <td className="py-2 px-3 text-gray-300">{policy.effectiveness}%</td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition-colors">Edit</button>
                      <button className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Templates */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Policy Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {policyTemplates.map((template, index) => (
            <div key={index} className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="text-white font-medium text-sm">{template.name}</div>
              <div className="text-gray-400 text-xs mt-1">{template.description}</div>
              <button className="text-cyan-400 text-xs mt-2 hover:text-cyan-300 transition-colors">
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
