# F1 Real-time Data Architecture with SignalR

## Overview

This implementation provides a real-time F1 data streaming architecture where:

1. **Backend (.NET)** connects to Formula 1's official SignalR/WebSocket service
2. **Backend** processes and broadcasts the data via its own SignalR hub
3. **Frontend (Next.js)** connects to the backend's SignalR hub for real-time updates

## Architecture Flow

```
F1 Official API → .NET Backend → SignalR Hub → Next.js Frontend → Live Dashboard
```

### Benefits of this approach:
- **Centralized data processing**: All F1 data is processed in one place
- **Authentication control**: Backend manages F1 API access
- **Data transformation**: Backend can clean, filter, and enhance data
- **Multiple client support**: Multiple frontend clients can connect
- **Caching**: Backend can cache data for performance
- **Error handling**: Centralized error handling and reconnection logic

## Backend Components

### 1. F1LiveTimingService
- Connects to F1's SignalR service
- Processes incoming F1 data
- Broadcasts structured data via SignalR hub

### 2. F1LiveDataHub
- SignalR hub for client connections
- Manages client groups and subscriptions
- Supports selective feed subscriptions

### 3. F1LiveDataController
- REST API for service status
- Restart functionality
- Health checks

## Frontend Components

### 1. F1SignalRService
- SignalR client service
- Handles connection management
- Automatic reconnection logic
- Authentication via JWT tokens

### 2. useF1LiveData Hook
- React hook for easy integration
- State management for connection and data
- Auto-subscription to feeds

### 3. F1LiveDataDemo Component
- Demonstration component
- Shows connection status
- Live data display
- Feed subscription controls

## Usage Examples

### Basic Usage with Hook

```typescript
import { useF1LiveData } from '@/hooks/use-f1-live-data';

function MyF1Component() {
  const { data, status, isConnected, subscribeToFeed } = useF1LiveData({
    autoConnect: true,
    subscribedFeeds: ['CarData', 'Position', 'TimingData']
  });

  return (
    <div>
      <p>Status: {status}</p>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      {data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
```

### Manual Service Usage

```typescript
import { F1SignalRService } from '@/lib/f1SignalRService';

const f1Service = new F1SignalRService();

f1Service.setOnDataReceived((data) => {
  console.log('Received F1 data:', data);
});

f1Service.setOnStatusChanged((status) => {
  console.log('Connection status:', status);
});

await f1Service.connect();
await f1Service.subscribeToFeed('CarData');
```

## Available F1 Data Feeds

The system supports all standard F1 feeds:

- **CarData**: Real-time car telemetry (speed, RPM, gear, etc.)
- **Position**: Driver positions and gaps
- **TimingData**: Lap times, sector times
- **SessionInfo**: Session details, flags, status
- **WeatherData**: Track conditions
- **TrackStatus**: Yellow flags, safety car, etc.
- **DriverList**: Driver information
- **RaceControlMessages**: Official race messages
- **SessionData**: Session progress
- **LapCount**: Current lap information
- **TimingStats**: Statistical timing data
- **TimingAppData**: Timing application data
- **TeamRadio**: Team radio messages (when available)

## Configuration

### Backend Configuration

In `appsettings.json`:
```json
{
  "JWT": {
    "Key": "your-jwt-key",
    "Issuer": "your-issuer",
    "Audience": "your-audience"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=turnone.db"
  }
}
```

### Frontend Configuration

Environment variables:
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url
```

## Authentication

The system uses JWT authentication:

1. User logs in via REST API
2. JWT token is stored in localStorage
3. SignalR connection uses JWT for authentication
4. Backend validates JWT for all SignalR operations

## Error Handling

### Backend
- Automatic reconnection to F1 services
- Error logging and monitoring
- Graceful degradation

### Frontend
- Automatic reconnection with exponential backoff
- Connection state management
- Error callbacks for custom handling

## Deployment Considerations

### Backend
- Ensure WebSocket support in hosting environment
- Configure CORS for SignalR connections
- Monitor F1 service connection health

### Frontend
- WebSocket fallback to long polling
- Handle authentication token renewal
- Implement proper error boundaries

## Testing

### Demo Page
Visit `/f1-signalr-demo` to test the complete system:
- Connection status monitoring
- Live data display
- Feed subscription testing
- Backend service controls

### API Endpoints
- `GET /api/f1livedata/status` - Service status
- `POST /api/f1livedata/restart` - Restart F1 service

## Monitoring

### Key Metrics to Monitor
- F1 service connection uptime
- SignalR client connections
- Data processing latency
- Error rates and types

### Logs to Watch
- F1 connection events
- SignalR hub events
- Authentication failures
- Data processing errors

This architecture provides a robust, scalable foundation for real-time F1 data applications with proper separation of concerns and reliable data streaming.