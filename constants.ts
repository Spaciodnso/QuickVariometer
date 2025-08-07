
import { Settings, UnitSystem, FlightData } from './types';

export const DEFAULT_SETTINGS: Settings = {
  unitSystem: UnitSystem.Metric,
  liftThreshold: 0.2, // m/s
  sinkThreshold: -2.0, // m/s
  autoTheme: true,
};

export const INITIAL_FLIGHT_DATA: FlightData = {
  verticalSpeed: 0,
  altitudeAGL: 0,
  altitudeMSL: 0,
  groundSpeed: 0,
  glideRatio: 0,
  heading: null,
  gForce: 1,
  maxGForce: 1,
  lat: null,
  lon: null,
};

// Conversion factors
export const METERS_TO_FEET = 3.28084;
export const MS_TO_KPH = 3.6;
export const MS_TO_MPH = 2.23694;
export const MS_TO_FPM = 196.85;

export const SEA_LEVEL_PRESSURE = 1013.25; // hPa

// Complementary filter coefficient
export const COMPLEMENTARY_FILTER_ALPHA = 0.98;
