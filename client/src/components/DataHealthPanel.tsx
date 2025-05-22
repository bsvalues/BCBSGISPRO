import React from "react";

interface DataHealthPanelProps {
  status: "good" | "warning" | "bad";
  lastScan: string;
  badRecords: number;
  onScan: () => void;
}

export const DataHealthPanel: React.FC<DataHealthPanelProps> = ({
  status,
  lastScan,
  badRecords,
  onScan,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "good":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "bad":
        return "bg-red-500";
      default:
        return "bg-emerald-500";
    }
  };

  return (
    <div className="bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-700/50 w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-zinc-200 text-xl font-bold">Data Health</h3>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-zinc-400 text-sm">
            {status === "good" ? "Healthy" : status === "warning" ? "Warning" : "Critical"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col">
          <span className="text-zinc-400 text-sm mb-1">Last Scan</span>
          <span className="text-zinc-200 font-medium">{lastScan}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-zinc-400 text-sm mb-1">Bad Records</span>
          <span className="text-zinc-200 font-medium">{badRecords}</span>
        </div>

        <button
          onClick={onScan}
          className="w-full py-2 px-4 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors mt-2"
        >
          Run Health Check
        </button>
      </div>
    </div>
  );
};