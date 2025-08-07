
export enum UnitSystem {
  Metric = 'Metric',
  Imperial = 'Imperial',
}

export interface Settings {
  unitSystem: UnitSystem;
  liftThreshold: number; // m/s
  sinkThreshold: number; // m/s
  autoTheme: boolean;
}

export interface FlightData {
  verticalSpeed: number; // m/s
  altitudeAGL: number; // meters
  altitudeMSL: number; // meters
  groundSpeed: number; // m/s
  glideRatio: number;
  heading: number | null; // degrees
  gForce: number;
  maxGForce: number;
  lat: number | null;
  lon: number | null;
}

export interface FlightPoint {
  lat: number;
  lon: number;
  alt: number; // MSL
  time: number; // timestamp
  vSpeed: number; // m/s
}

export interface SavedFlight {
  id: string;
  startTime: number;
  endTime: number;
  track: FlightPoint[];
}

export interface SensorStatus {
    geolocation: 'prompt' | 'granted' | 'denied' | 'unavailable';
    barometer: 'prompt' | 'granted' | 'denied' | 'unavailable';
    motion: 'prompt' | 'granted' | 'denied' | 'unavailable';
    magnetometer: 'prompt' | 'granted' | 'denied' | 'unavailable';
    ambient: 'prompt' | 'granted' | 'denied' | 'unavailable';
}
