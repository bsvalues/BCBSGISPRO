import React from "react";

interface AiStatusCalloutProps {
  message: string;
}

export const AiStatusCallout: React.FC<AiStatusCalloutProps> = ({ message }) => {
  return (
    <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-zinc-700/50 w-full max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
        </div>
        <div className="text-zinc-200 font-medium">{message}</div>
      </div>
    </div>
  );
};