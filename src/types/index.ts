export interface BusStop {
  id: string; // naptanId e.g. "490014977C"
  name: string;
  lat: number;
  lon: number;
  towards?: string;
}

export interface Arrival {
  id: string;
  lineName: string;
  destinationName: string;
  expectedArrival: string; // ISO datetime
  timeToStation: number; // seconds
  vehicleId: string;
}

export interface Coordinates {
  lat: number;
  lon: number;
}
