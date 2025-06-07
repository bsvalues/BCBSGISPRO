import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CollapseProps {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
  contentClassName?: string;
  duration?: number;
}

export const Collapse: React.FC<CollapseProps> = ({
  children,
  isOpen,
  className,
  contentClassName,
  duration = 300
}) => {
  const [height, setHeight] = useState<number | string>(isOpen ? 'auto' : 0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const contentHeight = ref.current.scrollHeight;

    if (isOpen) {
      setIsTransitioning(true);
      setHeight(contentHeight);
      
      const timeout = setTimeout(() => {
        setHeight('auto');
        setIsTransitioning(false);
      }, duration);
      
      return () => clearTimeout(timeout);
    } else {
      setIsTransitioning(true);
      
      // Force a reflow to ensure the browser calculates the height
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const reflow = ref.current.offsetHeight;
      
      setHeight(contentHeight);
      
      // Defer height setting to next frame to ensure animation works
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0);
          
          const timeout = setTimeout(() => {
            setIsTransitioning(false);
          }, duration);
          
          return () => clearTimeout(timeout);
        });
      });
    }
  }, [isOpen, duration]);

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all",
        className
      )}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        transitionDuration: `${duration}ms`,
      }}
    >
      <div className={cn(contentClassName)}>
        {children}
      </div>
    </div>
  );
};