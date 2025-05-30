import React from "react";
import { Clock, AlertCircle, RefreshCw } from "lucide-react";

interface SystemStatusFooterProps {
  uptime: string;
  errors: string;
  lastRestart: string;
}

export const SystemStatusFooter: React.FC<SystemStatusFooterProps> = ({
  uptime,
  errors,
  lastRestart,
}) => {
  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800 py-3 px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-zinc-500" />
          <span>Uptime: {uptime}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-zinc-500" />
          <span>Errors: {errors}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-zinc-500" />
          <span>Last restart: {lastRestart}</span>
        </div>
      </div>
    </div>
  );
};