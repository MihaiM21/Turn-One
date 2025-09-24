#!/usr/bin/env node

import F1DataExporter from './f1DataExporter';

async function runF1DataAcquisition() {
  const exporter = new F1DataExporter();

  console.log('🏁 F1 Live Data Acquisition Tool');
  console.log('================================');
  console.log('');

  try {
    // Connect to F1 live timing
    console.log('Connecting to F1 live timing...');
    await exporter.connect();

    // Start logging
    exporter.startLogging();

    // Show stats every 10 seconds
    const statsInterval = setInterval(() => {
      const stats = exporter.getStats();
      console.log(`📊 Stats: Messages: ${stats.messageCount}, Active: ${stats.isActive}, Logged: ${stats.loggedMessages}`);
      
      // Show some live data if available
      const currentData = exporter.getCurrentData();
      if (currentData.TrackStatus) {
        console.log(`🏁 Track Status: ${JSON.stringify(currentData.TrackStatus)}`);
      }
      if (currentData.SessionInfo) {
        console.log(`ℹ️ Session: ${JSON.stringify(currentData.SessionInfo)}`);
      }
    }, 10000);

    // Handle shutdown gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      clearInterval(statsInterval);
      
      // Save data before exit
      exporter.saveToFile();
      exporter.disconnect();
      
      console.log('✅ Shutdown complete');
      process.exit(0);
    });

    // Keep the process running
    console.log('✅ F1 Data acquisition running. Press Ctrl+C to stop and save data.');
    console.log('📝 Data will be automatically saved when you exit.');
    
  } catch (error) {
    console.error('❌ Error starting F1 data acquisition:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runF1DataAcquisition().catch(console.error);
}

export default runF1DataAcquisition;