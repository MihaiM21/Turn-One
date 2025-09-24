'use client';

// Data mapper to transform F1 API data to dashboard format
interface F1RawData {
  SessionInfo?: {
    Meeting?: {
      Name?: string;
      Location?: string;
    };
    Name?: string;
    Type?: string;
    StartDate?: string;
    EndDate?: string;
  };
  SessionData?: {
    Series?: string;
    StatusSeries?: string;
    Status?: string;
  };
  TimingData?: {
    Lines?: Record<string, {
      RacingNumber?: string;
      Line?: number;
      Position?: string;
      TimeDiffToFastest?: string;
      TimeDiffToPositionAhead?: string;
      LastLapTime?: {
        Value?: string;
        Personal?: boolean;
        Overall?: boolean;
      };
      BestLapTime?: {
        Value?: string;
      };
      Sectors?: Array<{
        Value?: string;
        Personal?: boolean;
        Overall?: boolean;
      }>;
      Speeds?: {
        I1?: {
          Value?: string;
        };
        I2?: {
          Value?: string;
        };
        FL?: {
          Value?: string;
        };
        ST?: {
          Value?: string;
        };
      };
    }>;
  };
  Position?: Record<string, {
    Status?: string;
    X?: number;
    Y?: number;
    Z?: number;
  }>;
  CarData?: Record<string, {
    Channels?: {
      0?: number; // RPM
      2?: number; // Speed
      3?: number; // nGear
      4?: number; // Throttle
      5?: number; // Brake
      45?: number; // DRS
    };
  }>;
  WeatherData?: {
    AirTemp?: string;
    Humidity?: string;
    Pressure?: string;
    Rainfall?: string;
    TrackTemp?: string;
    WindDirection?: string;
    WindSpeed?: string;
  };
  TrackStatus?: {
    Status?: string;
    Message?: string;
  };
  DriverList?: Record<string, {
    RacingNumber?: string;
    BroadcastName?: string;
    FullName?: string;
    Tla?: string;
    TeamName?: string;
    TeamColour?: string;
  }>;
  RaceControlMessages?: {
    Messages?: Record<string, {
      Utc?: string;
      Category?: string;
      Message?: string;
      Status?: string;
      Flag?: string;
    }>;
  };
  TeamRadio?: Record<string, {
    RacingNumber?: string;
    Captures?: Record<string, {
      Utc?: string;
      Recording?: string;
    }>;
  }>;
  LapCount?: {
    CurrentLap?: number;
    TotalLaps?: number;
  };
  ExtrapolatedClock?: {
    Utc?: string;
    Remaining?: string;
  };
}

export interface MappedF1Data {
  sessionInfo?: {
    type: string;
    name: string;
    status: string;
    timeRemaining: string;
    lapsRemaining?: number;
    currentLap?: number;
    totalLaps?: number;
  };
  weather?: {
    temperature: number;
    humidity: number;
    trackTemp: number;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    visibility: number;
    rainfall: boolean;
    rainIntensity?: number;
    pressure: number;
    conditions: 'sunny' | 'cloudy' | 'overcast' | 'light-rain' | 'heavy-rain';
  };
  trackStatus?: {
    status: string;
    message: string;
    flagColor: string;
    sector1?: string;
    sector2?: string;
    sector3?: string;
  };
  positions?: Array<{
    position: number;
    driverNumber: string;
    driverName: string;
    team: string;
    gap: string;
    interval: string;
    lastLapTime: string;
    bestLapTime?: string;
    currentLapTime?: string;
    sector1?: string;
    sector2?: string;
    sector3?: string;
    speed: number;
    drs: boolean;
    positionChange?: number;
    isOnTrack: boolean;
    tires: {
      compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet';
      age: number;
    };
  }>;
  raceControlMessages?: Array<{
    timestamp: string;
    category: string;
    message: string;
    flag?: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  teamRadio?: Array<{
    timestamp: string;
    driverName: string;
    driverNumber: string;
    message: string;
    team: string;
  }>;
  fastestLaps?: Array<{
    position: number;
    driverName: string;
    lapTime: string;
    lap: number;
  }>;
}

export class F1DataMapper {
  private static driverCache: Map<string, any> = new Map();

  public static mapF1Data(rawData: F1RawData): MappedF1Data {
    const result: MappedF1Data = {};

    // Cache driver information
    if (rawData.DriverList) {
      Object.entries(rawData.DriverList).forEach(([key, driver]) => {
        if (driver.RacingNumber) {
          this.driverCache.set(driver.RacingNumber, driver);
        }
      });
    }

    // Map session information
    result.sessionInfo = this.mapSessionInfo(rawData);
    
    // Map weather data
    result.weather = this.mapWeatherData(rawData);
    
    // Map track status
    result.trackStatus = this.mapTrackStatus(rawData);
    
    // Map positions and timing
    result.positions = this.mapPositions(rawData);
    
    // Map race control messages
    result.raceControlMessages = this.mapRaceControlMessages(rawData);
    
    // Map team radio
    result.teamRadio = this.mapTeamRadio(rawData);
    
    // Map fastest laps
    result.fastestLaps = this.mapFastestLaps(rawData);

    return result;
  }

  private static mapSessionInfo(rawData: F1RawData): MappedF1Data['sessionInfo'] {
    const sessionInfo = rawData.SessionInfo;
    const sessionData = rawData.SessionData;
    const extrapolatedClock = rawData.ExtrapolatedClock;
    const lapCount = rawData.LapCount;

    if (!sessionInfo && !sessionData) return undefined;

    return {
      type: sessionInfo?.Type || 'Unknown',
      name: sessionInfo?.Name || 'F1 Session',
      status: sessionData?.Status || 'Unknown',
      timeRemaining: extrapolatedClock?.Remaining || '00:00:00',
      currentLap: lapCount?.CurrentLap,
      totalLaps: lapCount?.TotalLaps,
      lapsRemaining: lapCount?.TotalLaps && lapCount?.CurrentLap ? 
        lapCount.TotalLaps - lapCount.CurrentLap : undefined
    };
  }

  private static mapWeatherData(rawData: F1RawData): MappedF1Data['weather'] {
    const weather = rawData.WeatherData;
    if (!weather) return undefined;

    const airTemp = parseFloat(weather.AirTemp || '20');
    const trackTemp = parseFloat(weather.TrackTemp || '25');
    const humidity = parseFloat(weather.Humidity || '50');
    const windSpeed = parseFloat(weather.WindSpeed || '5');
    const windDirection = parseFloat(weather.WindDirection || '0');
    const pressure = parseFloat(weather.Pressure || '1013');
    const rainfall = weather.Rainfall === '1' || weather.Rainfall === 'true';

    let conditions: 'sunny' | 'cloudy' | 'overcast' | 'light-rain' | 'heavy-rain' = 'sunny';
    if (rainfall) {
      conditions = windSpeed > 15 ? 'heavy-rain' : 'light-rain';
    } else if (humidity > 80) {
      conditions = 'overcast';
    } else if (humidity > 60) {
      conditions = 'cloudy';
    }

    return {
      temperature: Math.round(airTemp),
      humidity: Math.round(humidity),
      trackTemp: Math.round(trackTemp),
      windSpeed: Math.round(windSpeed),
      windDirection: Math.round(windDirection),
      visibility: rainfall ? 5 : 10, // Estimate visibility
      rainfall,
      pressure: Math.round(pressure),
      conditions
    };
  }

  private static mapTrackStatus(rawData: F1RawData): MappedF1Data['trackStatus'] {
    const trackStatus = rawData.TrackStatus;
    if (!trackStatus) return undefined;

    let flagColor = 'green';
    const status = trackStatus.Status || '';
    
    if (status.includes('RED') || status === '6') flagColor = 'red';
    else if (status.includes('YELLOW') || status === '4') flagColor = 'yellow';
    else if (status.includes('GREEN') || status === '1') flagColor = 'green';
    else if (status.includes('BLUE') || status === '5') flagColor = 'blue';

    return {
      status: status === '1' ? 'Green' : status === '4' ? 'Yellow' : status === '6' ? 'Red' : 'Unknown',
      message: trackStatus.Message || 'Track status unknown',
      flagColor
    };
  }

  private static mapPositions(rawData: F1RawData): MappedF1Data['positions'] {
    const timingData = rawData.TimingData;
    const carData = rawData.CarData;
    const positionData = rawData.Position;

    if (!timingData?.Lines) return [];

    const positions: MappedF1Data['positions'] = [];

    Object.entries(timingData.Lines).forEach(([driverNumber, timing]) => {
      const driver = this.driverCache.get(driverNumber);
      const carInfo = carData?.[driverNumber];
      const posInfo = positionData?.[driverNumber];

      if (!timing.Position) return;

      const position = parseInt(timing.Position) || 0;
      const speed = carInfo?.Channels?.[2] || 0;
      const drs = (carInfo?.Channels?.[45] || 0) > 0;
      const isOnTrack = posInfo?.Status !== 'OnTrack' ? false : true;

      positions.push({
        position,
        driverNumber: timing.RacingNumber || driverNumber,
        driverName: driver?.BroadcastName || driver?.FullName || `Driver ${driverNumber}`,
        team: driver?.TeamName || 'Unknown Team',
        gap: timing.TimeDiffToFastest || '',
        interval: timing.TimeDiffToPositionAhead || '',
        lastLapTime: timing.LastLapTime?.Value || '',
        bestLapTime: timing.BestLapTime?.Value,
        sector1: timing.Sectors?.[0]?.Value,
        sector2: timing.Sectors?.[1]?.Value,
        sector3: timing.Sectors?.[2]?.Value,
        speed: Math.round(speed * 3.6), // Convert m/s to km/h
        drs,
        isOnTrack,
        // For now, we'll estimate tire data since it's not always available in live timing
        tires: {
          compound: 'medium' as const,
          age: Math.floor(Math.random() * 20) + 1 // Placeholder
        }
      });
    });

    return positions.sort((a, b) => a.position - b.position);
  }

  private static mapRaceControlMessages(rawData: F1RawData): MappedF1Data['raceControlMessages'] {
    const messages = rawData.RaceControlMessages?.Messages;
    if (!messages) return [];

    const result: MappedF1Data['raceControlMessages'] = [];

    Object.entries(messages).forEach(([id, message]) => {
      if (!message.Utc) return;

      const timestamp = new Date(message.Utc).toLocaleTimeString();
      let severity: 'info' | 'warning' | 'critical' = 'info';

      const category = message.Category || 'INFO';
      const messageText = message.Message || '';

      if (category.includes('PENALTY') || messageText.includes('PENALTY')) {
        severity = 'critical';
      } else if (category.includes('WARNING') || category.includes('INVESTIGATE')) {
        severity = 'warning';
      }

      result.push({
        timestamp,
        category,
        message: messageText,
        flag: message.Flag,
        severity
      });
    });

    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 20);
  }

  private static mapTeamRadio(rawData: F1RawData): MappedF1Data['teamRadio'] {
    const teamRadio = rawData.TeamRadio;
    if (!teamRadio) return [];

    const result: MappedF1Data['teamRadio'] = [];

    Object.entries(teamRadio).forEach(([driverNumber, radio]) => {
      const driver = this.driverCache.get(radio.RacingNumber || driverNumber);
      
      if (radio.Captures) {
        Object.entries(radio.Captures).forEach(([id, capture]) => {
          if (!capture.Utc) return;

          const timestamp = new Date(capture.Utc).toLocaleTimeString();
          
          result.push({
            timestamp,
            driverName: driver?.BroadcastName || driver?.FullName || `Driver ${driverNumber}`,
            driverNumber: radio.RacingNumber || driverNumber,
            message: 'Radio transmission recorded', // Actual message content not available in live timing
            team: driver?.TeamName || 'Unknown Team'
          });
        });
      }
    });

    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10);
  }

  private static mapFastestLaps(rawData: F1RawData): MappedF1Data['fastestLaps'] {
    const timingData = rawData.TimingData;
    if (!timingData?.Lines) return [];

    const laps: Array<{
      driverName: string;
      lapTime: string;
      driverNumber: string;
    }> = [];

    Object.entries(timingData.Lines).forEach(([driverNumber, timing]) => {
      const driver = this.driverCache.get(driverNumber);
      const bestLap = timing.BestLapTime?.Value;

      if (bestLap && driver) {
        laps.push({
          driverName: driver.BroadcastName || driver.FullName || `Driver ${driverNumber}`,
          lapTime: bestLap,
          driverNumber
        });
      }
    });

    // Sort by lap time and assign positions
    laps.sort((a, b) => {
      const aTime = this.lapTimeToSeconds(a.lapTime);
      const bTime = this.lapTimeToSeconds(b.lapTime);
      return aTime - bTime;
    });

    return laps.slice(0, 10).map((lap, index) => ({
      position: index + 1,
      driverName: lap.driverName,
      lapTime: lap.lapTime,
      lap: 1 // Placeholder - actual lap number not always available
    }));
  }

  private static lapTimeToSeconds(lapTime: string): number {
    if (!lapTime) return Infinity;
    
    const parts = lapTime.split(':');
    if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return parseInt(minutes) * 60 + parseFloat(seconds);
    }
    
    return parseFloat(lapTime) || Infinity;
  }
}