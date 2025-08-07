
import { SavedFlight, FlightPoint } from '../types';

const toISOStringWithMillis = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

export const exportToGPX = (flight: SavedFlight): string => {
  const trackPoints = flight.track
    .map(
      (p: FlightPoint) => `
    <trkpt lat="${p.lat}" lon="${p.lon}">
      <ele>${p.alt.toFixed(2)}</ele>
      <time>${toISOStringWithMillis(p.time)}</time>
    </trkpt>`
    )
    .join('');

  const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="VarioPWA"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>VarioPWA Flight on ${new Date(flight.startTime).toLocaleDateString()}</name>
    <time>${toISOStringWithMillis(flight.startTime)}</time>
  </metadata>
  <trk>
    <name>Flight Track</name>
    <trkseg>${trackPoints}
    </trkseg>
  </trk>
</gpx>`;

  return gpxContent;
};

export const downloadGPX = (flight: SavedFlight) => {
    const gpxString = exportToGPX(flight);
    const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const flightDate = new Date(flight.startTime).toISOString().split('T')[0];
    a.href = url;
    a.download = `VarioPWA_Flight_${flightDate}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
