# Turn One Live F1 Dashboard

A real-time Formula 1 dashboard built with the Turn One theme, featuring comprehensive telemetry and timing data visualization.

## Features

### 🏁 Live Timing & Positions
- Real-time position updates with position change indicators
- Gap analysis and interval timing
- Sector times with color-coded performance indicators
- Lap times (current, best, and last)
- DRS status and speed monitoring
- Tire compound and age tracking
- On-track/pit status

### 🌤️ Weather & Track Conditions
- Live weather monitoring (temperature, humidity, wind)
- Track temperature with dynamic color coding
- Atmospheric pressure and visibility
- Rain detection and intensity
- Wind direction and speed with gusts
- Visual weather condition indicators

### 📡 Real-time Data Feeds
- Connection status monitoring
- Live update timestamps
- Session information (type, status, time remaining)
- Track status with flag conditions
- Fastest lap tracking

### 🎧 Communication Monitoring
- Race Control messages with severity indicators
- Team radio communications
- Driver-specific message filtering
- Timestamped message history

## Technical Implementation

### Components
- **LiveTimingGrid**: Advanced timing and position display
- **LiveWeather**: Comprehensive weather monitoring
- **LiveSectorTimes**: Detailed sector analysis
- Responsive design with mobile support

### Theme Integration
- Turn One dark theme with F1 red accents
- Glowing effects and modern gradients
- Consistent typography and spacing
- Card hover animations and transitions

### Data Structure
The dashboard expects live data in a structured format including:
- Session information (type, status, timing)
- Weather data (temperature, humidity, conditions)
- Position data (timing, gaps, sectors, tires)
- Communication data (radio, race control)

## Usage

1. Navigate to `/live` in the dashboard
2. The connection status will show in the top-right
3. Data updates automatically every 3 seconds (in demo mode)
4. All components are responsive and mobile-friendly

## Future Enhancements

- Real F1 Live Timing API integration
- Historical data comparison
- Driver-specific detail views
- Customizable dashboard layouts
- Export functionality for data analysis
- Push notifications for key events

## Development Notes

Currently uses mock data for demonstration. In production, this would connect to the F1 Live Timing API through the existing `liveAcquisition.ts` service.

The dashboard is built to be easily extendable with additional telemetry data points and visualization components.