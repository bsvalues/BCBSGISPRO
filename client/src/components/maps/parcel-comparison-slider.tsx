import { useState, useRef, useEffect, MouseEvent, TouchEvent } from "react";

interface ParcelComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number; // 0-100
  className?: string;
}

/**
 * A slider component for comparing before/after views of parcels
 * 
 * This component allows users to drag a divider to compare two images
 * representing different states or views of a property/parcel.
 */
export function ParcelComparisonSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  initialPosition = 50,
  className = ""
}: ParcelComparisonSliderProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse down events to start dragging
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  // Handle touch start events for mobile
  const handleTouchStart = () => {
    setIsDragging(true);
  };
  
  // Calculate position based on mouse or touch position
  const calculatePosition = (clientX: number) => {
    if (!sliderRef.current) return;
    
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const sliderWidth = sliderRect.width;
    const offsetX = clientX - sliderRect.left;
    
    // Calculate percentage position (0-100)
    let newPosition = (offsetX / sliderWidth) * 100;
    
    // Clamp position between 0 and 100
    newPosition = Math.max(0, Math.min(100, newPosition));
    
    setPosition(newPosition);
  };
  
  // Handle mouse movement when dragging
  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!isDragging) return;
    calculatePosition(e.clientX);
  };
  
  // Handle touch movement for mobile
  const handleTouchMove = (e: globalThis.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    calculatePosition(e.touches[0].clientX);
  };
  
  // Stop dragging when mouse is released
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Set up and clean up global event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);
  
  return (
    <div 
      ref={sliderRef}
      className={`relative w-full overflow-hidden rounded-lg glass-panel h-[500px] select-none ${className}`}
      style={{ 
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      {/* Before Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${beforeImage})`,
          filter: 'contrast(1.05)' 
        }}
      />
      
      {/* After Image - clips based on slider position */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${afterImage})`,
          clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`,
          filter: 'contrast(1.05)'
        }}
      />
      
      {/* Labels for the before/after images */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Before Label */}
        <div 
          className="absolute top-4 right-4 glass-panel backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            opacity: 1 - (position / 100) * 0.8
          }}
        >
          {beforeLabel}
        </div>
        
        {/* After Label */}
        <div 
          className="absolute top-4 left-4 glass-panel backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            opacity: (position / 100) * 0.8 + 0.2
          }}
        >
          {afterLabel}
        </div>
      </div>
      
      {/* Slider Divider Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ 
          left: `${position}%`,
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.7), 0 0 5px rgba(255, 255, 255, 0.5)'
        }}
      />
      
      {/* Slider Handle */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ 
          left: `${position}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 3px 15px rgba(0, 0, 0, 0.2)',
          border: '2px solid white',
          transition: 'box-shadow 0.2s ease',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex space-x-0.5">
          <div className="w-0.5 h-6 bg-gray-400 rounded-full"></div>
          <div className="w-0.5 h-6 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      {/* Instruction Overlay - only shown initially */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none glass-panel backdrop-blur-sm"
        style={{ 
          background: 'rgba(0, 0, 0, 0.3)',
          transition: 'opacity 0.3s ease',
          opacity: isDragging ? 0 : 0.7
        }}
      >
        <div className="text-center text-white px-6 py-4 rounded-lg glass-panel backdrop-blur-md">
          <p className="text-lg font-medium mb-1">Drag to compare parcel views</p>
          <p className="text-sm opacity-80">Slide left or right to compare the images</p>
        </div>
      </div>
    </div>
  );
}