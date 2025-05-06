import * as React from "react";
import { cn } from "../../lib/utils";

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number;
    max?: number;
    showValue?: boolean;
    size?: "default" | "sm" | "lg";
    colorMapping?: Record<string, string>;
    thresholds?: number[];
  }
>(
  (
    { 
      className, 
      value = 0, 
      max = 100, 
      showValue = false, 
      size = "default",
      colorMapping,
      thresholds,
      ...props 
    }, 
    ref
  ) => {
    // Calculate the progress percentage
    const percent = Math.min(Math.max(0, value), max) / max;
    
    // Determine the color based on thresholds
    let colorClass = "bg-primary";
    
    if (thresholds && colorMapping) {
      for (let i = 0; i < thresholds.length; i++) {
        if (percent * 100 <= thresholds[i]) {
          colorClass = colorMapping[`threshold${i}`] || "bg-primary";
          break;
        }
      }
    }
    
    // Set size-specific classes
    const sizeClasses = {
      sm: "h-2",
      default: "h-4",
      lg: "h-6"
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all",
            colorClass
          )}
          style={{ transform: `translateX(-${100 - percent * 100}%)` }}
        />
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
            {Math.round(percent * 100)}%
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };