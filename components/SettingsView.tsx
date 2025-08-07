
import React, { useState, useEffect } from 'react';
import { Settings, UnitSystem, SavedFlight } from '../types';
import { getAllFlights, deleteFlight } from '../services/flightLogService';
import { downloadGPX } from '../services/gpxExporter';

interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (newSettings: Settings) => void;
  onClose: () => void;
  onCalibrateAGL: () => void;
  onCalibrateMSL: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChange, onClose, onCalibrateAGL, onCalibrateMSL }) => {
  const [flights, setFlights] = useState<SavedFlight[]>([]);

  useEffect(() => {
    getAllFlights().then(setFlights);
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this flight?')) {
        await deleteFlight(id);
        setFlights(flights.filter(f => f.id !== id));
    }
  };

  const handleExport = (flight: SavedFlight) => {
    downloadGPX(flight);
  };

  return (
    <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm p-4 text-white z-50 overflow-y-auto">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settings &amp; Logbook</h1>
          <button onClick={onClose} className="text-3xl">&times;</button>
        </div>

        <div className="space-y-6">
          {/* Settings */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">General</h2>
            <div className="flex items-center justify-between">
              <label>Unit System</label>
              <select 
                value={settings.unitSystem} 
                onChange={e => onSettingsChange({...settings, unitSystem: e.target.value as UnitSystem})}
                className="bg-gray-700 p-1 rounded"
              >
                <option value={UnitSystem.Metric}>Metric</option>
                <option value={UnitSystem.Imperial}>Imperial</option>
              </select>
            </div>
             <div className="flex items-center justify-between mt-2">
              <label>Auto Theme</label>
              <input 
                type="checkbox"
                checked={settings.autoTheme} 
                onChange={e => onSettingsChange({...settings, autoTheme: e.target.checked})}
                className="w-5 h-5"
              />
            </div>
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
             <h2 className="text-xl font-semibold mb-3">Calibration</h2>
             <div className="flex space-x-2">
                <button onClick={onCalibrateAGL} className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded">Set AGL to 0</button>
                <button onClick={onCalibrateMSL} className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded">Sync MSL from GPS</button>
             </div>
          </div>

          {/* Flight Log */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Flight Logbook</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {flights.length === 0 && <p className="text-gray-400">No saved flights.</p>}
              {flights.map(flight => (
                <div key={flight.id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                  <div>
                    <p>{new Date(flight.startTime).toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Duration: {Math.round((flight.endTime - flight.startTime) / 60000)} min</p>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => handleExport(flight)} className="bg-green-600 px-2 py-1 rounded">GPX</button>
                    <button onClick={() => handleDelete(flight.id)} className="bg-red-600 px-2 py-1 rounded">Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <button onClick={onClose} className="mt-8 w-full bg-gray-600 hover:bg-gray-700 p-3 rounded-lg text-lg">
          Close
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
