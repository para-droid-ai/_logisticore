
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface WeightSliderProps {
  promptId: string;
  initialWeight: number;
  color: string;
  onWeightChange: (promptId: string, weight: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const WeightSlider: React.FC<WeightSliderProps> = ({
  promptId,
  initialWeight,
  color,
  onWeightChange,
  min = 0.01,
  max = 2.0,
  step = 0.01,
}) => {
  const [currentWeight, setCurrentWeight] = useState(initialWeight);
  const sliderRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const radius = 28;
  const strokeWidth = 6;
  const center = radius;

  const valueToAngle = useCallback((value: number) => {
    const totalAngleSweep = 270; 
    const startAngleSVG = -225; 
    
    const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return startAngleSVG + normalizedValue * totalAngleSweep;
  }, [min, max]);

  const angleToValue = useCallback((centerX: number, centerY: number, clientX: number, clientY: number) => {
    const mathAngleRad = Math.atan2(clientY - centerY, clientX - centerX);
    const mathAngleDeg = mathAngleRad * (180 / Math.PI);
    let svgAngleDeg = -mathAngleDeg; // SVG angle: 0 is East, positive clockwise

    const arcStartSvgAngle = -225; // Corresponds to min value (e.g., bottom-left)
    const arcSweepDeg = 270;      // The visual sweep of the arc

    // Calculate offset from the start of the arc, normalized to [0, 360)
    let offsetFromStartDeg = svgAngleDeg - arcStartSvgAngle;
    offsetFromStartDeg = (offsetFromStartDeg % 360 + 360) % 360;

    let valuePercent;

    if (offsetFromStartDeg <= arcSweepDeg) {
      // Mouse is within the active arc
      valuePercent = offsetFromStartDeg / arcSweepDeg;
    } else {
      // Mouse is in the dead zone
      const deadZoneSweep = 360 - arcSweepDeg; // e.g., 90 degrees
      const deadZoneMidPointOffset = arcSweepDeg + deadZoneSweep / 2; // e.g., 270 + 45 = 315

      if (offsetFromStartDeg < deadZoneMidPointOffset) {
        // Closer to the end of the arc (max value)
        valuePercent = 1.0;
      } else {
        // Closer to the start of the arc (min value)
        valuePercent = 0.0;
      }
    }
    
    valuePercent = Math.max(0, Math.min(1, valuePercent)); // Ensure it's strictly [0, 1]

    let newValue = min + valuePercent * (max - min);
    newValue = Math.round(newValue / step) * step; // Snap to step
    return Math.max(min, Math.min(max, newValue));

  }, [min, max, step]);


  const handleInteraction = useCallback((eventClientX: number, eventClientY: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let newValue = angleToValue(centerX, centerY, eventClientX, eventClientY);
    
    setCurrentWeight(newValue);
    onWeightChange(promptId, newValue);
  }, [angleToValue, promptId, onWeightChange]);


  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;
    handleInteraction(event.clientX, event.clientY);
  }, [isDragging, handleInteraction]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
     setIsDragging(true);
     const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
     const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
     handleInteraction(clientX, clientY);
  };
  
  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const change = event.deltaY > 0 ? -step : step;
    let newValue = Math.max(min, Math.min(max, currentWeight + change));
    newValue = Math.round(newValue / step) * step;
    setCurrentWeight(newValue);
    onWeightChange(promptId, newValue);
  };

  useEffect(() => {
    setCurrentWeight(initialWeight);
  }, [initialWeight]);


  const currentAngleForDrawing = valueToAngle(currentWeight);
  
  const handleTipX = center + (radius - strokeWidth / 2) * Math.cos(currentAngleForDrawing * (Math.PI / 180));
  const handleTipY = center + (radius - strokeWidth / 2) * Math.sin(currentAngleForDrawing * (Math.PI / 180));
  
  const describeArcPath = (x: number, y: number, pathRadius: number, startAngleDeg: number, endAngleDeg: number) => {
    const startPoint = {
      x: x + pathRadius * Math.cos(startAngleDeg * Math.PI / 180),
      y: y + pathRadius * Math.sin(startAngleDeg * Math.PI / 180)
    };
    const endPoint = {
      x: x + pathRadius * Math.cos(endAngleDeg * Math.PI / 180),
      y: y + pathRadius * Math.sin(endAngleDeg * Math.PI / 180)
    };
    const sweepAngleDeg = endAngleDeg - startAngleDeg;
    const largeArcFlag = Math.abs(sweepAngleDeg) > 180 ? "1" : "0";
    
    const d = [
        "M", startPoint.x, startPoint.y, 
        "A", pathRadius, pathRadius, 0, largeArcFlag , 1, endPoint.x, endPoint.y 
    ].join(" ");
    return d;       
  }

  const trackArcPath = describeArcPath(center, center, radius - strokeWidth / 2, valueToAngle(min), valueToAngle(max));
  const progressArcPath = describeArcPath(center, center, radius - strokeWidth / 2, valueToAngle(min), currentAngleForDrawing);

  return (
    <div className="flex flex-col items-center select-none" style={{ touchAction: 'none' }}>
      <svg 
        ref={sliderRef} 
        width={radius * 2} 
        height={radius * 2} 
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onTouchMove={(e) => { if(isDragging) handleInteraction(e.touches[0].clientX, e.touches[0].clientY)}}
        onTouchEnd={handleMouseUp}
        className="cursor-pointer"
      >
        <path
          d={trackArcPath}
          fill="none"
          stroke="rgba(128, 128, 128, 0.3)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={progressArcPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx={handleTipX}
          cy={handleTipY}
          r={strokeWidth / 1.5} 
          fill={color}
          stroke="#0D1117" 
          strokeWidth="1.5"
          className="cursor-grab" 
        />
        <text
          x={center}
          y={center + 4} 
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill={color}
          className="pointer-events-none"
        >
          {currentWeight.toFixed(2)}
        </text>
      </svg>
    </div>
  );
};

export default WeightSlider;
