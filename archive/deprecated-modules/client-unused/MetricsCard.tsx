import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string;
  details: string[];
  showDetails: boolean;
  onToggle: () => void;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  details,
  showDetails,
  onToggle,
}) => {
  return (
    <div className="bg-zinc-800 rounded-2xl p-6 shadow-xl border border-zinc-700/50 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-zinc-200 text-xl font-bold">{title}</h3>
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-zinc-700 transition-colors"
        >
          {showDetails ? <ChevronUp size={18} className="text-zinc-300" /> : <ChevronDown size={18} className="text-zinc-300" />}
        </button>
      </div>

      <div className="text-zinc-200 text-4xl font-bold mb-4">{value}</div>

      {showDetails && (
        <div className="pt-4 border-t border-zinc-700">
          <h4 className="text-zinc-400 text-sm mb-2">Details</h4>
          <ul className="space-y-2">
            {details.map((detail, index) => (
              <li key={index} className="text-zinc-300 text-sm">{detail}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};