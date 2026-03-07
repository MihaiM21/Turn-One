'use client';

// Data mapper to transform F1 API data to dashboard format
interface F1RawData {
  SessionInfo?: {
    Meeting?: {
      Name?: string;
      Location?: string;
    };
    SessionStatus?: string;
    Name?: string;
    Type?: string;
    StartDate?: string;
    EndDate?: string;
    Path?: string;
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
      InPit?: boolean;
      Retired?: boolean;
      NumberOfLaps?: number;
      NumberOfPitStops?: number;
      KnockedOut?: boolean;
      LastLapTime?: {
        Value?: string;
        Status?: number;
        OverallFastest?: boolean;
        PersonalFastest?: boolean;
      };
      BestLapTime?: {
        Value?: string;
        Lap?: number;
      };
      Sectors?: Array<{
        Value?: string;
        Status?: number;
        OverallFastest?: boolean;
        PersonalFastest?: boolean;
        Segments?: Array<{
          Status?: number;
        }>;
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
    Captures?: Array<{
      Utc?: string;
      Path?: string;
      RacingNumber?: string;
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
  TimingAppData?: {
    Lines?: Record<string, {
      Stints?: Array<{
        LapFlags?: number;
        Compound?: string;
        New?: string;      // "true" | "false"
        TyresNotChanged?: string;
        TotalLaps?: number;
        StartLaps?: number;
        LapTime?: string;
        LapNumber?: number;
      }>;
    }>;
  };
}

export interface MappedF1Data {
  sessionInfo?: {
    type: string;
    name: string;
    status: string;
    timeRemaining: string;
    clockUtc?: string;
    lapsRemaining?: number;
    currentLap?: number;
    totalLaps?: number;
    path?: string;
    location?: string;
    year?: number;
    qualiSegment?: 'Q1' | 'Q2' | 'Q3';
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
    sector1Best?: boolean;
    sector2Best?: boolean;
    sector3Best?: boolean;
    sector1Segments?: Array<{
      status: number;
      // 2049 - Green - personal best,
      // 2048 - Yellow- slower,
      // 2051 - Purple - Overall best
    }>;
    sector2Segments?: Array<{
      status: number;
    }>;
    sector3Segments?: Array<{
      status: number;
    }>;
    speed: number;
    drs: boolean;
    positionChange?: number;
    isOnTrack: boolean;
    retired?: boolean;
    knockedOut?: boolean;
    numberOfLaps?: number;
    numberOfPitStops?: number;
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
    driverNumber: string;
    path: string;
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

    // For qualifying, recompute gaps from best lap times within the current segment
    if (result.positions && result.sessionInfo?.qualiSegment) {
      result.positions = this.recomputeQualiGaps(result.positions);
    }
    
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
      type: sessionInfo?.Name || 'Unknown',
      name: sessionInfo?.Meeting?.Name || 'F1 Session',
      status: sessionInfo?.SessionStatus || 'Unknown',
      timeRemaining: extrapolatedClock?.Remaining || '00:00:00',
      clockUtc: extrapolatedClock?.Utc,
      currentLap: lapCount?.CurrentLap,
      totalLaps: lapCount?.TotalLaps,
      path: sessionInfo?.Path,
      location: sessionInfo?.Meeting?.Location,
      year: sessionInfo?.Path ? parseInt(sessionInfo.Path.slice(0, 4), 10) || undefined : undefined,
      lapsRemaining: lapCount?.TotalLaps && lapCount?.CurrentLap ? 
        lapCount.TotalLaps - lapCount.CurrentLap : undefined,
      qualiSegment: F1DataMapper.detectQualiSegment(sessionInfo?.Name, sessionData?.Status, rawData),
    };
  }

  private static detectQualiSegment(
    sessionName: string | undefined,
    sessionStatus: string | undefined,
    rawData: F1RawData
  ): 'Q1' | 'Q2' | 'Q3' | undefined {
    if (!sessionName?.includes('Qualifying')) return undefined;
    const status = sessionStatus || '';
    if (/qualifying\s*3|q3/i.test(status)) return 'Q3';
    if (/qualifying\s*2|q2/i.test(status)) return 'Q2';
    if (/qualifying\s*1|q1/i.test(status)) return 'Q1';
    // Fallback: count non-knocked-out, non-retired drivers
    // 22-car grid: Q1→16 advance, Q2→10 advance, Q3→10 compete
    const lines = rawData.TimingData?.Lines ?? {};
    const active = Object.values(lines).filter(l => !l.KnockedOut && !l.Retired).length;
    if (active > 0 && active <= 10) return 'Q3';
    if (active > 0 && active <= 16) return 'Q2';
    return 'Q1';
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

      // Process speed data
      const speed = carInfo?.Channels?.[2] || 0;
      const drs = (carInfo?.Channels?.[45] || 0) > 0;
      
      // Process track status
      const isOnTrack = !timing.InPit;
      const retired = timing.Retired || false;
      
      // Process timing data
      const lastLap = timing.LastLapTime?.Value || '';
      const bestLap = timing.BestLapTime?.Value;
      const gap = timing.TimeDiffToFastest || '';
      const interval = timing.TimeDiffToPositionAhead || '';
      
      // Process sector times and segments
      const sectors = timing.Sectors || [];
      const sector1 = sectors[0]?.Value;
      const sector2 = sectors[1]?.Value;
      const sector3 = sectors[2]?.Value;
      
      // Process sector status for highlighting
      const sector1Best = sectors[0]?.OverallFastest;
      const sector2Best = sectors[1]?.OverallFastest;
      const sector3Best = sectors[2]?.OverallFastest;
      
      // Process sector segments
      const sector1Segments = sectors[0]?.Segments?.map(seg => ({ status: seg.Status || 2048 })) || [];
      const sector2Segments = sectors[1]?.Segments?.map(seg => ({ status: seg.Status || 2048 })) || [];
      const sector3Segments = sectors[2]?.Segments?.map(seg => ({ status: seg.Status || 2048 })) || [];
      
      // Get speeds for different points
      const speeds = timing.Speeds || {};
      const speedTrap = parseFloat(speeds.ST?.Value || '0');
      const speedI1 = parseFloat(speeds.I1?.Value || '0');
      const speedI2 = parseFloat(speeds.I2?.Value || '0');
      const speedFL = parseFloat(speeds.FL?.Value || '0');

      positions.push({
        position: parseInt(timing.Position) || 0,
        driverNumber: timing.RacingNumber || driverNumber,
        driverName: driver?.BroadcastName || driver?.FullName || `Driver ${driverNumber}`,
        team: driver?.TeamName || 'Unknown Team',
        gap,
        interval,
        lastLapTime: lastLap,
        bestLapTime: bestLap,
        currentLapTime: '', // Will be updated in real-time
        sector1,
        sector2,
        sector3,
        sector1Best,
        sector2Best,
        sector3Best,
        sector1Segments,
        sector2Segments,
        sector3Segments,
        speed: Math.max(speedTrap, speedI1, speedI2, speedFL, Math.round(speed * 3.6)),
        drs,
        isOnTrack,
        retired,
        knockedOut: timing.KnockedOut || false,
        numberOfLaps: timing.NumberOfLaps || 0,
        numberOfPitStops: timing.NumberOfPitStops || 0,
        tires: this.mapTyres(rawData, driverNumber, timing.NumberOfLaps),
      });
    });

    return positions.sort((a, b) => a.position - b.position);
  }

  /** Extract current tyre compound and age from TimingAppData stints. */
  private static mapTyres(
    rawData: F1RawData,
    driverNumber: string,
    totalLaps: number | undefined
  ): { compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet'; age: number } {
    const DEFAULT = { compound: 'medium' as const, age: 0 };
    const stints = rawData.TimingAppData?.Lines?.[driverNumber]?.Stints;
    if (!stints || stints.length === 0) return DEFAULT;

    // Last element is the current stint
    const current = stints[stints.length - 1];
    if (!current) return DEFAULT;

    const compoundMap: Record<string, 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet'> = {
      SOFT:         'soft',
      MEDIUM:       'medium',
      HARD:         'hard',
      INTERMEDIATE: 'intermediate',
      WET:          'wet',
      // Sometimes the API sends lowercase or abbreviated
      soft:         'soft',
      medium:       'medium',
      hard:         'hard',
      intermediate: 'intermediate',
      wet:          'wet',
    };

    const compound = compoundMap[current.Compound ?? ''] ?? 'medium';

    // Age = laps completed on this stint
    // TotalLaps is updated live; fall back to (totalDriverLaps - startLaps)
    let age = current.TotalLaps ?? 0;
    if (age === 0 && current.StartLaps !== undefined && totalLaps !== undefined) {
      age = Math.max(0, totalLaps - current.StartLaps);
    }

    return { compound, age };
  }

  /** Parse an F1 lap-time string ("1:20.456" or "80.456") into milliseconds. Returns null if unparseable. */
  private static parseLapTimeMs(t: string | undefined): number | null {
    if (!t) return null;
    const cleaned = t.replace(/[^0-9:.]/g, '');
    const colonIdx = cleaned.indexOf(':');
    if (colonIdx !== -1) {
      const mins = parseInt(cleaned.slice(0, colonIdx), 10);
      const secs = parseFloat(cleaned.slice(colonIdx + 1));
      if (isNaN(mins) || isNaN(secs)) return null;
      return (mins * 60 + secs) * 1000;
    }
    const secs = parseFloat(cleaned);
    return isNaN(secs) ? null : secs * 1000;
  }

  /** Format a positive gap in milliseconds as "+M:SS.mmm" or "+S.mmm". */
  private static formatGapMs(ms: number): string {
    if (ms <= 0) return '';
    const totalSecs = ms / 1000;
    if (totalSecs >= 60) {
      const m = Math.floor(totalSecs / 60);
      const s = (totalSecs % 60).toFixed(3).padStart(6, '0');
      return `+${m}:${s}`;
    }
    return `+${totalSecs.toFixed(3)}`;
  }

  /** Recompute the gap field for every position based on best-lap-time differences (used for FP / Qualifying). */
  private static recomputeQualiGaps(
    positions: NonNullable<MappedF1Data['positions']>
  ): NonNullable<MappedF1Data['positions']> {
    // Find the fastest best lap among non-knocked-out drivers with a valid time
    let fastestMs: number | null = null;
    for (const p of positions) {
      if (p.knockedOut) continue;
      const ms = this.parseLapTimeMs(p.bestLapTime);
      if (ms !== null && (fastestMs === null || ms < fastestMs)) fastestMs = ms;
    }
    if (fastestMs === null) return positions; // No times yet — leave as-is

    return positions.map(p => {
      const ms = this.parseLapTimeMs(p.bestLapTime);
      const gap = ms !== null ? this.formatGapMs(ms - fastestMs!) : p.gap;
      return { ...p, gap };
    });
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
  if (!teamRadio || !Array.isArray(teamRadio.Captures)) return [];

  const result: MappedF1Data['teamRadio'] = [];

  teamRadio.Captures.forEach((capture) => {
    if (capture.Utc && capture.Path && capture.RacingNumber) {
      result.push({
        driverNumber: capture.RacingNumber,
        timestamp: capture.Utc,
        path: capture.Path,
      });
    }
  });

  return result
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);
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