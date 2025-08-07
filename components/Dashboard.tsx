
import React from 'react';
import { FlightData, Settings, UnitSystem } from '../types';
import { METERS_TO_FEET, MS_TO_FPM, MS_TO_KPH, MS_TO_MPH } from '../constants';
import DataWidget from './ui/DataWidget';
import VarioMeter from './ui/VarioMeter';
import Compass from './ui/Compass';

interface DashboardProps {
  flightData: FlightData;
  settings: Settings;
  flightTime: string;
}

const Dashboard: React.FC<DashboardProps> = ({ flightData, settings, flightTime }) => {
  const { unitSystem } = settings;
  const { 
    verticalSpeed, altitudeAGL, altitudeMSL, groundSpeed, 
    glideRatio, gForce, maxGForce, heading 
  } = flightData;

  const isMetric = unitSystem === UnitSystem.Metric;

  const displayVario = isMetric ? verticalSpeed.toFixed(1) : (verticalSpeed * MS_TO_FPM).toFixed(0);
  const varioUnit = isMetric ? 'm/s' : 'fpm';

  const displayAltAGL = isMetric ? altitudeAGL.toFixed(0) : (altitudeAGL * METERS_TO_FEET).toFixed(0);
  const displayAltMSL = isMetric ? altitudeMSL.toFixed(0) : (altitudeMSL * METERS_TO_FEET).toFixed(0);
  const altUnit = isMetric ? 'm' : 'ft';

  const displaySpeed = isMetric ? (groundSpeed * MS_TO_KPH).toFixed(0) : (groundSpeed * MS_TO_MPH).toFixed(0);
  const speedUnit = isMetric ? 'km/h' : 'mph';

  return (
    <div className="w-full h-full flex flex-col p-2 space-y-2 bg-black">
      <div className="grid grid-cols-3 gap-2">
        <DataWidget label="AGL" value={displayAltAGL} unit={altUnit} />
        <DataWidget label="Speed" value={displaySpeed} unit={speedUnit} />
        <DataWidget label="MSL" value={displayAltMSL} unit={altUnit} />
      </div>

      <div className="flex-grow flex items-center justify-around space-x-2">
        <VarioMeter verticalSpeed={verticalSpeed} />
        <div className="flex flex-col items-center justify-center space-y-4">
            <DataWidget label="Vario" value={displayVario} unit={varioUnit} className="w-36" valueClassName="text-5xl" />
            <Compass heading={heading} />
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <DataWidget label="Glide" value={glideRatio.toFixed(1)} />
        <DataWidget label="G-Force" value={gForce.toFixed(2)} />
        <DataWidget label="Max G" value={maxGForce.toFixed(2)} />
        <DataWidget label="Time" value={flightTime} />
      </div>
    </div>
  );
};

export default Dashboard;
