
import { useState, useEffect, useRef, useCallback } from 'react';
import { FlightData, SensorStatus } from '../types';
import { INITIAL_FLIGHT_DATA, SEA_LEVEL_PRESSURE, COMPLEMENTARY_FILTER_ALPHA } from '../constants';

// --- Sensor Interfaces (W3C Generic Sensor API) ---
// These are not exported by a library, so we define them for TypeScript
interface SensorOptions {
  frequency?: number;
}

interface Sensor extends EventTarget {
  start(): void;
  stop(): void;
}

declare var Barometer: {
  new(options?: SensorOptions): Sensor & { pressure?: number };
};

declare var Accelerometer: {
  new(options?: SensorOptions): Sensor & { x?: number; y?: number; z?: number };
};

declare var Gyroscope: {
  new(options?: SensorOptions): Sensor & { x?: number; y?: number; z?: number };
};

declare var Magnetometer: {
  new(options?: SensorOptions): Sensor & { x?: number; y?: number; z?: number };
};

declare var AmbientLightSensor: {
    new(options?: SensorOptions): Sensor & { illuminance?: number };
};

// --- Hook Implementation ---

const useSensors = (isFlightActive: boolean) => {
  const [flightData, setFlightData] = useState<FlightData>(INITIAL_FLIGHT_DATA);
  const [status, setStatus] = useState<SensorStatus>({
      geolocation: 'prompt', barometer: 'prompt', motion: 'prompt', magnetometer: 'prompt', ambient: 'prompt'
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const seaLevelPressureRef = useRef(SEA_LEVEL_PRESSURE);
  const lastTimestampRef = useRef<number | null>(null);
  const altitudeRef = useRef(0);
  const verticalSpeedRef = useRef(0);
  const maxGForceRef = useRef(1);

  const pressureToAltitude = useCallback((pressure: number, seaLevelPressure: number) => {
    return 44330 * (1.0 - Math.pow(pressure / seaLevelPressure, 0.1903));
  }, []);

  const calibrateAltitudeAGL = (agl: number) => {
    setFlightData(prev => ({...prev, altitudeAGL: agl}));
  };

  const calibrateAltitudeMSL = (msl: number) => {
      // Recalculate sea level pressure based on current pressure and known MSL altitude
      const currentPressure = flightData.altitudeMSL > 0 ? (SEA_LEVEL_PRESSURE * Math.pow(1 - msl/44330, 5.255)) : SEA_LEVEL_PRESSURE;
      seaLevelPressureRef.current = currentPressure;
      setFlightData(prev => ({...prev, altitudeMSL: msl}));
  };

  useEffect(() => {
    if (!isFlightActive) return;

    let geoWatchId: number | null = null;
    let barometer: (Sensor & { pressure?: number; }) | null = null;
    let accelerometer: (Sensor & { x?: number; y?: number; z?: number; }) | null = null;
    let magnetometer: (Sensor & { x?: number; y?: number; z?: number; }) | null = null;
    let ambientLightSensor: (Sensor & { illuminance?: number; }) | null = null;
    
    // --- Geolocation ---
    if ('geolocation' in navigator) {
      geoWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          setStatus(s => ({...s, geolocation: 'granted'}));
          setFlightData(prev => ({
            ...prev,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            altitudeMSL: pos.coords.altitude || prev.altitudeMSL,
            groundSpeed: pos.coords.speed || 0,
          }));
        },
        (err) => {
          console.error('Geolocation error:', err);
          setStatus(s => ({...s, geolocation: 'denied'}));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
        setStatus(s => ({...s, geolocation: 'unavailable'}));
    }

    // --- Barometer & Accelerometer (Sensor Fusion) ---
    const startBaroAndAccel = async () => {
        try {
            await navigator.permissions.query({ name: 'accelerometer' as PermissionName });
            await navigator.permissions.query({ name: 'barometer' as PermissionName });
            setStatus(s => ({...s, barometer: 'granted', motion: 'granted'}));

            barometer = new Barometer({ frequency: 10 });
            accelerometer = new Accelerometer({ frequency: 10 });

            barometer.addEventListener('error', e => { setStatus(s => ({...s, barometer: 'denied'})); console.error('Barometer error', e) });
            accelerometer.addEventListener('error', e => { setStatus(s => ({...s, motion: 'denied'})); console.error('Accelerometer error', e) });
            
            barometer.addEventListener('reading', () => {
                if (!barometer?.pressure || !accelerometer?.z) return;

                const now = Date.now();
                const dt = lastTimestampRef.current ? (now - lastTimestampRef.current) / 1000 : 0.0;
                lastTimestampRef.current = now;

                if (dt === 0) return;

                const baroAlt = pressureToAltitude(barometer.pressure, seaLevelPressureRef.current);
                
                // Complementary Filter
                // altitude integrated from accelerometer (high-pass)
                const accelAltChange = verticalSpeedRef.current * dt + 0.5 * accelerometer.z * dt * dt;
                // new altitude is a combination of predicted altitude and measured altitude
                altitudeRef.current = COMPLEMENTARY_FILTER_ALPHA * (altitudeRef.current + accelAltChange) + (1.0 - COMPLEMENTARY_FILTER_ALPHA) * baroAlt;
                
                const newVerticalSpeed = (altitudeRef.current - flightData.altitudeAGL) / dt;
                verticalSpeedRef.current = newVerticalSpeed;

                const gForce = Math.sqrt(Math.pow(accelerometer.x!, 2) + Math.pow(accelerometer.y!, 2) + Math.pow(accelerometer.z!, 2)) / 9.81;
                if (gForce > maxGForceRef.current) {
                    maxGForceRef.current = gForce;
                }

                setFlightData(prev => ({
                    ...prev,
                    altitudeAGL: altitudeRef.current,
                    verticalSpeed: newVerticalSpeed,
                    gForce: gForce,
                    maxGForce: maxGForceRef.current,
                    glideRatio: (prev.groundSpeed > 1 && newVerticalSpeed < -0.2) ? Math.abs(prev.groundSpeed / newVerticalSpeed) : 0,
                }));
            });

            barometer.start();
            accelerometer.start();

        } catch (error) {
            console.error('Failed to initialize pressure/motion sensors:', error);
            if((error as Error).name === 'NotAllowedError') {
                setStatus(s => ({...s, barometer: 'denied', motion: 'denied'}));
            } else {
                setStatus(s => ({...s, barometer: 'unavailable', motion: 'unavailable'}));
            }
        }
    };
    
    // --- Magnetometer (Compass) ---
    const startMagnetometer = async () => {
        try {
            await navigator.permissions.query({ name: 'magnetometer' as PermissionName });
            setStatus(s => ({...s, magnetometer: 'granted'}));
            magnetometer = new Magnetometer({ frequency: 1 });
            magnetometer.addEventListener('error', e => setStatus(s => ({...s, magnetometer: 'denied'})));
            magnetometer.addEventListener('reading', () => {
                if(magnetometer?.x === undefined || magnetometer?.y === undefined) return;
                let heading = Math.atan2(magnetometer.y, magnetometer.x) * (180 / Math.PI);
                if(heading < 0) heading += 360;
                setFlightData(prev => ({ ...prev, heading: heading }));
            });
            magnetometer.start();
        } catch (error) {
            console.error('Failed to init magnetometer:', error);
            setStatus(s => ({...s, magnetometer: (error as Error).name === 'NotAllowedError' ? 'denied' : 'unavailable' }));
        }
    };
    
    // --- Ambient Light Sensor ---
    const startAmbientLight = async () => {
         try {
            await navigator.permissions.query({ name: 'ambient-light-sensor' as PermissionName });
            setStatus(s => ({...s, ambient: 'granted'}));
            ambientLightSensor = new AmbientLightSensor({ frequency: 0.5 });
            ambientLightSensor.addEventListener('error', e => setStatus(s => ({...s, ambient: 'denied'})));
            ambientLightSensor.addEventListener('reading', () => {
                if (ambientLightSensor?.illuminance === undefined) return;
                // Switch to dark mode if lux is low, e.g., < 50
                setIsDarkMode(ambientLightSensor.illuminance < 50);
            });
            ambientLightSensor.start();
        } catch (error) {
            console.error('Failed to init ambient light sensor:', error);
            setStatus(s => ({...s, ambient: (error as Error).name === 'NotAllowedError' ? 'denied' : 'unavailable' }));
        }
    }

    startBaroAndAccel();
    startMagnetometer();
    startAmbientLight();

    return () => {
      if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
      if (barometer) barometer.stop();
      if (accelerometer) accelerometer.stop();
      if (magnetometer) magnetometer.stop();
      if (ambientLightSensor) ambientLightSensor.stop();
      lastTimestampRef.current = null;
    };
  }, [isFlightActive, pressureToAltitude]);

  return { flightData, status, isDarkMode, calibrateAltitudeAGL, calibrateAltitudeMSL };
};

export default useSensors;
