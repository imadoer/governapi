"use client";

import { useState } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export function SlackIntegration() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channel, setChannel] = useState("#security-alerts");
  const [testing, setTesting] = useState(false);

  const testSlackIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;
    setTesting(true);
    try {
      const response = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          message: "Test message from GovernAPI - Integration successful!",
          channel,
        }),
      });
      if (!response.ok) {
        console.error("Slack integration test failed");
      }
    } catch (error) {
      console.error("Failed to test Slack integration:", error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Slack Integration</h3>
        <ChatBubbleLeftRightIcon className="w-5 h-5 text-slate-400" />
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-slate-300 mb-2">Setup Instructions:</p>
        <ol className="list-decimal pl-5 text-sm text-slate-400 space-y-1">
          <li>Go to your Slack workspace settings</li>
          <li>Create a new &quot;Incoming Webhooks&quot; app</li>
          <li>Select the channel for alerts</li>
          <li>Copy the webhook URL and paste it below</li>
        </ol>
      </div>

      <form onSubmit={testSlackIntegration} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Slack Webhook URL</label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            required
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Channel</label>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="e.g., #security-alerts, #api-monitoring"
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={testing}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {testing && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
            Test Integration
          </button>
          <button
            type="button"
            className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/10 transition-all"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
