
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useSensors from './hooks/useSensors';
import useVarioAudio from './hooks/useVarioAudio';
import { Settings, FlightData, FlightPoint } from './types';
import { DEFAULT_SETTINGS, INITIAL_FLIGHT_DATA } from './constants';
import { saveFlight } from './services/flightLogService';
import Dashboard from './components/Dashboard';
import SettingsView from './components/SettingsView';

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isFlightActive, setIsFlightActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [flightTime, setFlightTime] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<FlightPoint[]>([]);

  const { flightData, isDarkMode, calibrateAltitudeAGL, calibrateAltitudeMSL } = useSensors(isFlightActive);
  const { resumeAudio } = useVarioAudio(flightData.verticalSpeed, settings, !isFlightActive);

  // Flight Timer
  useEffect(() => {
    let timer: number;
    if (isFlightActive) {
      timer = window.setInterval(() => {
        setFlightTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFlightActive]);

  // Track Logger
  useEffect(() => {
    let logger: number;
    if (isFlightActive && flightData.lat && flightData.lon) {
      logger = window.setInterval(() => {
        setCurrentTrack(prev => [...prev, {
          lat: flightData.lat!,
          lon: flightData.lon!,
          alt: flightData.altitudeMSL,
          time: Date.now(),
          vSpeed: flightData.verticalSpeed
        }]);
      }, 5000); // Log every 5 seconds
    }
    return () => clearInterval(logger);
  }, [isFlightActive, flightData]);

  const startFlight = () => {
    resumeAudio(); // Important for browser audio policy
    setFlightTime(0);
    setCurrentTrack([]);
    setIsFlightActive(true);
  };

  const stopFlight = async () => {
    setIsFlightActive(false);
    if (currentTrack.length > 1) {
      const flightToSave = {
        id: `flight-${Date.now()}`,
        startTime: currentTrack[0].time,
        endTime: Date.now(),
        track: currentTrack,
      };
      await saveFlight(flightToSave);
      alert('Flight saved successfully!');
    }
  };

  const handleToggleFlight = () => {
    if (isFlightActive) {
      stopFlight();
    } else {
      startFlight();
    }
  };

  const handleCalibrateAGL = () => {
      calibrateAltitudeAGL(0);
      setIsSettingsOpen(false);
  }

  const handleCalibrateMSL = () => {
      if(flightData.altitudeMSL){
        calibrateAltitudeMSL(flightData.altitudeMSL);
        setIsSettingsOpen(false);
      } else {
          alert("Cannot calibrate MSL: No GPS altitude available.");
      }
  }

  const formattedFlightTime = useMemo(() => {
    const hours = Math.floor(flightTime / 3600);
    const minutes = Math.floor((flightTime % 3600) / 60);
    const seconds = flightTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [flightTime]);

  useEffect(() => {
    const effectiveTheme = settings.autoTheme ? (isDarkMode ? 'dark' : 'light') : 'dark';
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    document.documentElement.classList.toggle('light', effectiveTheme === 'light');
    
    // Adjust body colors for light/dark mode
    if (effectiveTheme === 'light') {
        document.body.style.backgroundColor = '#f9fafb'; // gray-50
        document.body.style.color = '#111827'; // gray-900
    } else {
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#f9fafb';
    }
  }, [isDarkMode, settings.autoTheme]);


  return (
    <div className="w-screen h-screen font-sans flex flex-col items-center justify-center dark:bg-black bg-gray-50 dark:text-gray-50 text-gray-900 select-none">
      <Dashboard
        flightData={isFlightActive ? flightData : INITIAL_FLIGHT_DATA}
        settings={settings}
        flightTime={formattedFlightTime}
      />
      
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-20">
        <button onClick={() => setIsSettingsOpen(true)} className="bg-gray-700/80 text-white px-6 py-3 rounded-full text-lg shadow-xl">
          Menu
        </button>
        <button 
          onClick={handleToggleFlight} 
          className={`px-8 py-4 rounded-full text-xl font-bold shadow-xl ${isFlightActive ? 'bg-red-600/80 animate-pulse' : 'bg-green-600/80'}`}
        >
          {isFlightActive ? 'End Flight' : 'Start Flight'}
        </button>
      </div>

      {isSettingsOpen && (
        <SettingsView 
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setIsSettingsOpen(false)}
          onCalibrateAGL={handleCalibrateAGL}
          onCalibrateMSL={handleCalibrateMSL}
        />
      )}
    </div>
  );
};

export default App;
