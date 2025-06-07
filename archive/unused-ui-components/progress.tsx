import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-gray-200",
  {
    variants: {
      size: {
        default: "h-2",
        sm: "h-1",
        lg: "h-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
  max?: number;
  showValue?: boolean;
  colorMapping?: {
    [key: string]: string;
  };
  thresholds?: number[];
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, size, value = 0, max = 100, showValue = false, colorMapping, thresholds, ...props }, ref) => {
    // Calculate the percentage value
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    
    // Determine the color based on thresholds and color mapping
    let colorClass = "bg-primary";
    
    if (colorMapping && thresholds) {
      for (let i = 0; i < thresholds.length; i++) {
        if (percentage <= thresholds[i]) {
          colorClass = colorMapping[`threshold${i}`] || "bg-primary";
          break;
        }
      }
    }
    
    return (
      <div
        ref={ref}
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <div
          className={cn("h-full transition-all", colorClass)}
          style={{ width: `${percentage}%` }}
        />
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };