"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Modal, Input, Select, message, Spin, Tabs, Switch, Tag } from "antd";

interface PlatformApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  ipWhitelist: string[];
  expiresAt: string | null;
  isActive: boolean;
  lastUsed: string | null;
  usageCount: number;
  createdAt: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: string;
  status: string;
  scan_count: number;
  last_scan_date: string | null;
  avg_security_score: number | null;
  vulnerability_count: number;
}

export function ApiManagementPage({ companyId }: { companyId: string }) {
  // Platform API Keys state
  const [platformKeys, setPlatformKeys] = useState<PlatformApiKey[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([
    "read",
  ]);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [newKeyIpWhitelist, setNewKeyIpWhitelist] = useState<string>("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // API Discovery state
  const [discoverDomain, setDiscoverDomain] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoveredApis, setDiscoveredApis] = useState<any[]>([]);

  // API Endpoints state
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlatformKeys = async () => {
    try {
      const response = await fetch("/api/customer/platform-api-keys", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();
      if (data.success) {
        setPlatformKeys(data.apiKeys || []);
      }
    } catch (error) {
      console.error("Failed to fetch platform keys:", error);
    }
  };

  const fetchApiEndpoints = async () => {
    try {
      const response = await fetch("/api/customer/api-endpoints", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();
      if (data.success) {
        setApiEndpoints(data.endpoints || []);
      }
    } catch (error) {
      console.error("Failed to fetch endpoints:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchPlatformKeys();
      fetchApiEndpoints();
    }
  }, [companyId]);

  const handleCreatePlatformKey = async () => {
    if (!newKeyName) {
      message.error("Please enter a key name");
      return;
    }

    setSubmitting(true);
    try {
      const ipWhitelist = newKeyIpWhitelist
        .split(",")
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0);

      const response = await fetch("/api/customer/platform-api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
          rateLimit: newKeyRateLimit,
          ipWhitelist: ipWhitelist.length > 0 ? ipWhitelist : null,
          expiresInDays: 365,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKey(data.apiKey.key);
        message.success("API key created successfully!");
        fetchPlatformKeys();
      } else {
        message.error(data.error || "Failed to create API key");
      }
    } catch (error) {
      message.error("Failed to create API key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscoverApis = async () => {
    if (!discoverDomain) {
      message.error("Please enter a domain");
      return;
    }

    setDiscovering(true);
    try {
      const response = await fetch(
        `/api/customer/api-discovery?domain=${encodeURIComponent(discoverDomain)}`,
        {
          headers: { "x-tenant-id": companyId },
        },
      );
      const data = await response.json();

      if (data.success) {
        setDiscoveredApis(data.discovery.discoveredEndpoints || []);
        message.success(
          `Discovered ${data.discovery.discoveredEndpoints?.length || 0} APIs!`,
        );
      } else {
        message.error(data.error || "Discovery failed");
      }
    } catch (error) {
      message.error("Failed to discover APIs");
    } finally {
      setDiscovering(false);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    message.success("Copied to clipboard!");
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const closeKeyModal = () => {
    setShowNewKeyModal(false);
    setNewKeyName("");
    setNewKeyPermissions(["read"]);
    setNewKeyRateLimit(1000);
    setNewKeyIpWhitelist("");
    setGeneratedKey(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">API Management</h1>
        <p className="text-slate-400">
          Manage your GovernAPI platform keys and discover APIs to monitor
        </p>
      </div>

      <Tabs
        defaultActiveKey="platform-keys"
        items={[
          {
            key: "platform-keys",
            label: (
              <div className="flex items-center gap-2">
                <KeyIcon className="w-5 h-5" />
                <span>Your GovernAPI Keys</span>
              </div>
            ),
            children: (
              <div className="space-y-6">
                {/* Platform Keys Header */}
                <div className="flex items-center justify-between">
                  <p className="text-slate-400">
                    API keys to authenticate with GovernAPI
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNewKeyModal(true)}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Generate New Key
                  </motion.button>
                </div>

                {/* Platform Keys List */}
                <div className="space-y-3">
                  {platformKeys.map((key, index) => (
                    <motion.div
                      key={key.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {key.name}
                            </h3>
                            {key.isActive ? (
                              <Tag color="green">Active</Tag>
                            ) : (
                              <Tag color="red">Inactive</Tag>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <code className="px-3 py-1 bg-slate-900 rounded text-cyan-400 font-mono">
                              {key.keyPrefix}••••••••••••••••
                            </code>
                            <button
                              onClick={() =>
                                copyToClipboard(key.keyPrefix, key.id)
                              }
                              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              {copiedKeyId === key.id ? (
                                <CheckIcon className="w-4 h-4 text-green-500" />
                              ) : (
                                <ClipboardDocumentIcon className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>
                              Permissions: {key.permissions.join(", ")}
                            </span>
                            <span>•</span>
                            <span>Rate Limit: {key.rateLimit}/hr</span>
                            <span>•</span>
                            <span>Used: {key.usageCount} times</span>
                            {key.lastUsed && (
                              <>
                                <span>•</span>
                                <span>
                                  Last used:{" "}
                                  {new Date(key.lastUsed).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {platformKeys.length === 0 && (
                    <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                      <KeyIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">
                        No API keys yet. Generate your first key to get started.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "api-discovery",
            label: (
              <div className="flex items-center gap-2">
                <MagnifyingGlassIcon className="w-5 h-5" />
                <span>Discover APIs</span>
              </div>
            ),
            children: (
              <div className="space-y-6">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Scan Domain for APIs
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Enter a domain to automatically discover API endpoints via
                    OpenAPI/Swagger documentation
                  </p>

                  <div className="flex gap-4">
                    <Input
                      size="large"
                      prefix={
                        <GlobeAltIcon className="w-5 h-5 text-slate-400" />
                      }
                      placeholder="api.example.com"
                      value={discoverDomain}
                      onChange={(e) => setDiscoverDomain(e.target.value)}
                      onPressEnter={handleDiscoverApis}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDiscoverApis}
                      disabled={discovering}
                      className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                      {discovering ? (
                        <>
                          <Spin size="small" /> Scanning...
                        </>
                      ) : (
                        <>
                          <MagnifyingGlassIcon className="w-5 h-5" /> Discover
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {discoveredApis.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">
                      Discovered APIs ({discoveredApis.length})
                    </h3>
                    <div className="space-y-2">
                      {discoveredApis.map((api, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <Tag
                                  color={
                                    api.method === "GET"
                                      ? "blue"
                                      : api.method === "POST"
                                        ? "green"
                                        : "orange"
                                  }
                                >
                                  {api.method}
                                </Tag>
                                <span className="text-white font-mono">
                                  {api.path}
                                </span>
                              </div>
                              {api.description && (
                                <p className="text-sm text-slate-400">
                                  {api.description}
                                </p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                            >
                              Add to Monitor
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "monitored-apis",
            label: (
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" />
                <span>Monitored APIs ({apiEndpoints.length})</span>
              </div>
            ),
            children: (
              <div className="space-y-3">
                {apiEndpoints.map((endpoint, index) => (
                  <motion.div
                    key={endpoint.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Tag
                            color={
                              endpoint.method === "GET"
                                ? "blue"
                                : endpoint.method === "POST"
                                  ? "green"
                                  : "orange"
                            }
                          >
                            {endpoint.method}
                          </Tag>
                          <span className="text-white font-mono">
                            {endpoint.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>Scans: {endpoint.scan_count}</span>
                          {endpoint.avg_security_score && (
                            <>
                              <span>•</span>
                              <span>
                                Score: {Math.round(endpoint.avg_security_score)}
                              </span>
                            </>
                          )}
                          {endpoint.vulnerability_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-red-400">
                                {endpoint.vulnerability_count} vulns
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {apiEndpoints.length === 0 && (
                  <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                    <ShieldCheckIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">
                      No APIs being monitored yet. Use API Discovery to find
                      APIs to monitor.
                    </p>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Create Platform Key Modal */}
      <Modal
        title={
          generatedKey ? "🎉 API Key Created!" : "Generate New Platform API Key"
        }
        open={showNewKeyModal}
        onOk={generatedKey ? closeKeyModal : handleCreatePlatformKey}
        onCancel={closeKeyModal}
        okText={generatedKey ? "Done" : "Generate Key"}
        confirmLoading={submitting}
        width={600}
      >
        {generatedKey ? (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-600 font-semibold mb-2">
                ⚠️ Save this key securely!
              </p>
              <p className="text-sm text-yellow-600">
                This is the only time you'll see the full key. Store it in a
                secure location.
              </p>
            </div>

            <div className="relative">
              <Input.TextArea
                value={generatedKey}
                readOnly
                rows={3}
                className="font-mono"
              />
              <button
                onClick={() => copyToClipboard(generatedKey, "generated")}
                className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                {copiedKeyId === "generated" ? (
                  <CheckIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Key Name</label>
              <Input
                placeholder="e.g., Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Permissions
              </label>
              <Select
                mode="multiple"
                value={newKeyPermissions}
                onChange={setNewKeyPermissions}
                className="w-full"
                options={[
                  { value: "read", label: "Read" },
                  { value: "write", label: "Write" },
                  { value: "scan", label: "Scan" },
                  { value: "monitor", label: "Monitor" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Rate Limit (requests/hour)
              </label>
              <Input
                type="number"
                value={newKeyRateLimit}
                onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                IP Whitelist (optional, comma-separated)
              </label>
              <Input
                placeholder="192.168.1.0/24, 10.0.0.1"
                value={newKeyIpWhitelist}
                onChange={(e) => setNewKeyIpWhitelist(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
