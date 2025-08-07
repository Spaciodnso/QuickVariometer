
import React from 'react';

interface VarioMeterProps {
  verticalSpeed: number; // m/s
}

const VarioMeter: React.FC<VarioMeterProps> = ({ verticalSpeed }) => {
  const maxVspeed = 5; // m/s for visualization range
  const percentage = (verticalSpeed / maxVspeed) * 100;
  
  let height = Math.min(Math.abs(percentage), 100);
  const isLifting = verticalSpeed > 0;
  
  const liftColor = 'bg-green-500';
  const sinkColor = 'bg-red-500';

  return (
    <div className="relative w-12 h-64 bg-gray-700 rounded-full overflow-hidden flex flex-col justify-end">
        {/* Center Line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400 z-10"></div>
      
        {/* Lift/Sink Bar */}
        <div 
            className={`w-full ${isLifting ? liftColor : sinkColor} transition-all duration-100 ease-linear`}
            style={{ 
                height: `${height / 2}%`,
                transform: isLifting ? 'translateY(0)' : `translateY(${height}%) rotate(180deg)`,
                transformOrigin: 'bottom',
                position: 'absolute',
                bottom: '50%'
            }}
        ></div>
    </div>
  );
};

export default VarioMeter;
