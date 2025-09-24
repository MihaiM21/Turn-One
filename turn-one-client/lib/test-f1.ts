const F1LiveDataAcquisition = require('./liveAcquisition').default;

console.log('Testing F1 Live Data Acquisition...');

const f1Data = new F1LiveDataAcquisition();

console.log('✅ F1LiveDataAcquisition class instantiated successfully');
console.log('📊 Initial message count:', f1Data.getMessageCount());
console.log('🔍 Initial data:', f1Data.getCurrentData());
console.log('📡 Is active:', f1Data.isActive());

console.log('\n🏁 F1 Live Data Acquisition module is ready!');
console.log('To start acquiring live data, use:');
console.log('- f1Data.connect() to connect to F1 live timing');
console.log('- f1Data.onData(callback) to receive data updates');
console.log('- f1Data.onStatus(callback) to monitor connection status');