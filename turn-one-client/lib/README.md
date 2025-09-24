# F1 Live Data Acquisition

A modern TypeScript implementation for acquiring live Formula 1 timing data from the official F1 SignalR stream.

## Features

- 🏎️ **Real-time F1 Data**: Connect to Formula 1's official live timing stream
- 📊 **Comprehensive Data**: Car positions, timing data, weather, track status, and more
- 💾 **Data Export**: Save live data to JSON files for analysis
- 🔄 **Auto-reconnect**: Automatic reconnection on connection loss
- 📡 **Event-driven**: Callback-based architecture for real-time processing
- 🛡️ **Type-safe**: Full TypeScript support with proper type definitions

## Available Data Streams

The acquisition system provides access to the following F1 data streams:

- **CarData**: Telemetry data including speed, throttle, brake, gear, DRS, etc.
- **Position**: Real-time driver positions and coordinates
- **TimingData**: Lap times, sector times, and timing information
- **SessionInfo**: Session details, track info, and session status
- **WeatherData**: Track temperature, air temperature, humidity, rainfall
- **TrackStatus**: Yellow flags, red flags, safety car status
- **DriverList**: Driver information and car numbers
- **RaceControlMessages**: Official race control communications
- **TeamRadio**: Team radio messages (when available)
- **LapCount**: Current lap count and total laps
- **SessionData**: Session type and timing information

## Installation

The required dependencies are already included in the project:

```bash
npm install ws @types/ws
```

## Usage

### Basic Data Acquisition

```typescript
import F1LiveDataAcquisition from './lib/liveAcquisition';

const f1Data = new F1LiveDataAcquisition();

// Listen for live data updates
f1Data.onData((data) => {
  console.log('Live F1 Data:', data);
  
  // Access specific data types
  if (data.CarData) {
    console.log('Car telemetry:', data.CarData);
  }
  
  if (data.TimingData) {
    console.log('Timing data:', data.TimingData);
  }
});

// Monitor connection status
f1Data.onStatus((status) => {
  console.log('Connection status:', status);
});

// Connect to F1 live timing
await f1Data.connect();
```

### Data Export and Logging

```typescript
import F1DataExporter from './lib/f1DataExporter';

const exporter = new F1DataExporter();

// Connect and start logging
await exporter.connect();
exporter.startLogging();

// Stop logging and save to file
setTimeout(() => {
  exporter.stopLogging();
  exporter.saveToFile('my-f1-session.json');
}, 60000); // Log for 1 minute
```

### Command Line Interface

Run the CLI tool to start data acquisition:

```bash
npx ts-node lib/f1-cli.ts
```

This will:
- Connect to F1 live timing
- Display real-time statistics
- Automatically save data when you exit (Ctrl+C)

## API Reference

### F1LiveDataAcquisition Class

#### Methods

- `connect()`: Connect to F1 live timing stream
- `disconnect()`: Disconnect and cleanup
- `onData(callback)`: Register callback for data updates
- `onStatus(callback)`: Register callback for status updates
- `getCurrentData()`: Get current state snapshot
- `getMessageCount()`: Get total messages received
- `isActive()`: Check if receiving active data (>5 messages)

#### Events

- **Data Event**: Fired when new F1 data is received
- **Status Event**: Fired on connection status changes ('connected', 'disconnected', 'error')

### F1DataExporter Class

#### Methods

- `connect()`: Connect to F1 data stream
- `disconnect()`: Disconnect and cleanup
- `startLogging()`: Begin logging data to memory
- `stopLogging()`: Stop logging data
- `saveToFile(filename?)`: Save logged data to JSON file
- `getStats()`: Get current statistics
- `getCurrentData()`: Get current F1 data snapshot

## Data Structure

The live data follows this general structure:

```typescript
interface F1LiveData {
  CarData?: {
    [carNumber: string]: {
      Speed: number;
      Gear: number;
      Throttle: number;
      Brake: boolean;
      DRS: boolean;
      // ... more telemetry data
    }
  };
  Position?: {
    [carNumber: string]: {
      X: number;
      Y: number;
      Z: number;
    }
  };
  TimingData?: {
    [carNumber: string]: {
      LastLapTime: string;
      Sectors: any[];
      // ... more timing data
    }
  };
  // ... other data streams
}
```

## Session Detection

The system automatically detects active F1 sessions:

- Connects to Formula 1's official SignalR endpoint
- Monitors message frequency to determine session activity
- Handles session start/end automatically
- Provides callbacks for session state changes

## Error Handling

- **Connection Failures**: Automatic retry with exponential backoff
- **Data Parsing Errors**: Graceful handling with error logging
- **Network Issues**: Auto-reconnection on connection loss
- **Session Timeouts**: Automatic cleanup and reconnection

## Development Notes

- The system uses Formula 1's official live timing infrastructure
- Data is only available during live F1 sessions (Practice, Qualifying, Race)
- Some data streams may be limited or unavailable depending on session type
- The connection uses WebSocket over SignalR protocol

## Examples

### Monitor Race Progress

```typescript
f1Data.onData((data) => {
  if (data.Position && data.TimingData) {
    // Analyze race positions and lap times
    Object.keys(data.Position).forEach(carNumber => {
      const position = data.Position[carNumber];
      const timing = data.TimingData[carNumber];
      console.log(`Car ${carNumber}: Position (${position.X}, ${position.Y}), Last Lap: ${timing?.LastLapTime}`);
    });
  }
});
```

### Track Status Monitoring

```typescript
f1Data.onData((data) => {
  if (data.TrackStatus) {
    const status = data.TrackStatus.Status;
    if (status === '1') console.log('🟢 Green Flag');
    if (status === '2') console.log('🟡 Yellow Flag');
    if (status === '4') console.log('🔴 Red Flag');
    if (status === '6') console.log('🚗 Virtual Safety Car');
  }
});
```

## Troubleshooting

1. **No data received**: Ensure there's an active F1 session running
2. **Connection errors**: Check internet connectivity and firewall settings
3. **TypeScript errors**: Ensure all dependencies are installed with `npm install`
4. **WebSocket errors**: The system will automatically retry connections

## License

This project is for educational and personal use. Formula 1 data belongs to Formula One World Championship Limited.