import F1LiveDataAcquisition from './liveAcquisition';

// Example usage of the F1 Live Data Acquisition
async function main() {
  const f1Data = new F1LiveDataAcquisition();

  // Set up data callback to receive live F1 data
  f1Data.onData((data) => {
    console.log('Received F1 data:', {
      messageCount: f1Data.getMessageCount(),
      isActive: f1Data.isActive(),
      hasCarData: !!data.CarData,
      hasTimingData: !!data.TimingData,
      hasWeatherData: !!data.WeatherData,
      hasTrackStatus: !!data.TrackStatus,
    });

    // Example: Log driver positions if available
    if (data.Position) {
      console.log('Driver Positions:', data.Position);
    }

    // Example: Log timing data if available
    if (data.TimingData) {
      console.log('Timing Data:', data.TimingData);
    }

    // Example: Log race control messages
    if (data.RaceControlMessages) {
      console.log('Race Control Messages:', data.RaceControlMessages);
    }
  });

  // Set up status callback to monitor connection status
  f1Data.onStatus((status) => {
    console.log('F1 Data Status:', status);
    
    switch (status) {
      case 'connected':
        console.log('✅ Connected to F1 live timing');
        break;
      case 'disconnected':
        console.log('❌ Disconnected from F1 live timing');
        break;
      case 'error':
        console.log('⚠️ Error with F1 live timing connection');
        break;
    }
  });

  // Connect to F1 live timing
  console.log('Connecting to F1 live timing...');
  await f1Data.connect();

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('Shutting down...');
    f1Data.disconnect();
    process.exit(0);
  });
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default main;