  export interface TopSpeedData {
    team: string;
    speed: number;
    color: string;
  }

  export interface ThrottleAverageData {
    driver: string;
    throttle: number;
    color: string;
  }

  export interface TrackTelemetryPoint {
    x: number;
    y: number;
    distance: number;
    speed: number;
    driver: string;
    minisector: number;
    fastest_driver: string;
    fastest_driver_int: number;
  }

  export interface TrackComparisonData {
    driver1: string;
    driver2: string;
    driver1_color: string;
    driver2_color: string;
    telemetry: TrackTelemetryPoint[];
    session_info: {
      year: number;
      race: string;
      event: string;
      event_name: string;
      session_name: string;
    };
  }
