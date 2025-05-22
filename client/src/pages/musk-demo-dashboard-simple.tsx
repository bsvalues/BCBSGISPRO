import React, { useState } from "react";
import { AiStatusCallout } from "../components/AiStatusCallout";
import { DataHealthPanel } from "../components/DataHealthPanel";
import { MetricsCard } from "../components/MetricsCard";
import { SystemStatusFooter } from "../components/SystemStatusFooter";
import { useToast } from "../hooks/use-toast";

// Placeholder for map/timeline
const MainPanel: React.FC = () => {
  return (
    <div className="bg-zinc-800 rounded-2xl p-6 shadow-xl h-72 flex flex-col justify-center items-center w-full">
      <div className="text-zinc-200 text-2xl font-bold mb-2">Parcel Map & Timeline</div>
      <div className="text-zinc-400">[Interactive GIS map or event timeline appears here]</div>
      {/* Place for expansion: onClick parcel to open modal/details */}
    </div>
  );
};

const MuskDemoDashboardSimple: React.FC = () => {
  const { addToast } = useToast();
  // Metrics expand state
  const [showMetrics, setShowMetrics] = useState(false);
  // Example props
  const aiSummary = "AI says: All systems nominal. No anomalies detected in Benton County property data.";
  const metricsDetails = [
    "Last closed: Parcel #10003 (Staff, 2h ago)",
    "1 appeal in progress",
    "Avg. time to close: 1.1 days",
  ];

  const handleHealthScan = () => {
    addToast({
      title: "Health check initiated",
      description: "Scanning all county property records for data integrity...",
      type: "success",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top: AI Callout */}
      <div className="w-full flex justify-center py-6">
        <AiStatusCallout message={aiSummary} />
      </div>

      {/* Main Row */}
      <div className="flex flex-row gap-8 justify-center items-start flex-1 px-12">
        {/* Left: Data Health */}
        <div className="flex flex-col items-center" style={{ flex: 1 }}>
          <DataHealthPanel
            status="good"
            lastScan="Just now"
            badRecords={0}
            onScan={handleHealthScan}
          />
        </div>
        {/* Center: Main Visualization */}
        <div style={{ flex: 2 }}>
          <MainPanel />
        </div>
        {/* Right: Metrics */}
        <div className="flex flex-col items-center" style={{ flex: 1 }}>
          <MetricsCard
            title="Active Workflows"
            value="19"
            details={metricsDetails}
            showDetails={showMetrics}
            onToggle={() => setShowMetrics(!showMetrics)}
          />
        </div>
      </div>

      {/* Footer: System Status */}
      <SystemStatusFooter
        uptime="99.999%"
        errors="0 critical, 0 warnings"
        lastRestart="1d ago"
      />
    </div>
  );
};

export default MuskDemoDashboardSimple;