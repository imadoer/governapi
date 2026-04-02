"use client";

import { useEffect, useState } from "react";
import { Card, Progress } from "antd";
import { supabase } from "@/lib/db/supabase";

interface APIStats {
  critical: number;
  internal: number;
  external: number;
  unclassified: number;
  total: number;
}

export function LiveAPIInventory() {
  const [stats, setStats] = useState<APIStats>({
    critical: 0,
    internal: 0,
    external: 0,
    unclassified: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: apis } = await supabase
        .from("apis")
        .select("classification");

      if (apis) {
        const stats = apis.reduce(
          (acc, api) => {
            acc.total++;
            acc[api.classification as keyof APIStats]++;
            return acc;
          },
          { critical: 0, internal: 0, external: 0, unclassified: 0, total: 0 },
        );

        setStats(stats);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const classificationPercentage =
    stats.total > 0
      ? Math.round(((stats.total - stats.unclassified) / stats.total) * 100)
      : 0;

  return (
    <Card title="API Inventory" extra="View All">
      <div className="flex items-center justify-center mb-4">
        <Progress
          type="circle"
          percent={classificationPercentage}
          format={(percent) => `${percent}%`}
          width={120}
        />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Critical APIs:</span>
          <span className="font-semibold">{stats.critical}</span>
        </div>
        <div className="flex justify-between">
          <span>Internal APIs:</span>
          <span className="font-semibold">{stats.internal}</span>
        </div>
        <div className="flex justify-between">
          <span>External APIs:</span>
          <span className="font-semibold">{stats.external}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-orange-500">Unclassified:</span>
          <span className="font-semibold text-orange-500">
            {stats.unclassified}
          </span>
        </div>
      </div>
    </Card>
  );
}
