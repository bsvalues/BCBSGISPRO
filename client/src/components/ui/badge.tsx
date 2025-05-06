import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
        // Custom variants for map element categories
        layout: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        navigation: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
        identification: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        data: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
        visual: "bg-amber-100 text-amber-800 hover:bg-amber-200",
        technical: "bg-gray-100 text-gray-800 hover:bg-gray-200",
        // Element importance levels
        high: "bg-red-100 text-red-800 hover:bg-red-200",
        medium: "bg-orange-100 text-orange-800 hover:bg-orange-200",
        low: "bg-green-100 text-green-800 hover:bg-green-200",
        // Implementation status
        implemented: "bg-green-100 text-green-800 hover:bg-green-200",
        partial: "bg-amber-100 text-amber-800 hover:bg-amber-200",
        missing: "bg-red-100 text-red-800 hover:bg-red-200",
      },
      size: {
        default: "h-6",
        sm: "h-5 text-[10px]",
        lg: "h-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };