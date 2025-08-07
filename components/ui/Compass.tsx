
import React from 'react';

interface CompassProps {
  heading: number | null;
}

const Compass: React.FC<CompassProps> = ({ heading }) => {
  const rotation = heading !== null ? -heading : 0; // Rotate the whole rose

  return (
    <div className="w-48 h-48 rounded-full bg-gray-800 border-4 border-gray-700 flex items-center justify-center relative shadow-lg">
      <div 
        className="w-full h-full transition-transform duration-200 ease-linear"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 text-2xl font-bold text-red-500">N</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 -mb-1 text-xl font-bold text-gray-300">S</div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 text-xl font-bold text-gray-300">W</div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-1 text-xl font-bold text-gray-300">E</div>
      </div>
      {/* Needle */}
      <div className="absolute w-2 h-20 bg-red-500 top-4 origin-bottom" style={{ transform: `rotate(0deg)` }}>
          <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-16 border-b-red-500 absolute -top-4 -left-3"></div>
      </div>
      <div className="absolute w-2 h-20 bg-gray-400 bottom-4 origin-top" style={{ transform: `rotate(0deg)` }}></div>
      <div className="w-4 h-4 bg-white rounded-full z-10"></div>
      
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <span className="text-3xl font-mono text-white z-20 bg-gray-800/50 px-2 rounded">
          {heading !== null ? Math.round(heading).toString().padStart(3, '0') : '---'}°
        </span>
      </div>
    </div>
  );
};

export default Compass;
