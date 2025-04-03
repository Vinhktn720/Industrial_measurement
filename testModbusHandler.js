import { writeCalibrationData } from './modbusHandler.js';

// Mock Modbus client
const mockModbusClient = {
  writeSingleRegister: async (register, value) => {
    console.log(`Mock write to register ${register} with value ${value}`);
  },
};

// Mock the `modbusClient` in `modbusHandler.js`
global.modbusClient = mockModbusClient;

// Simulated sensor data
let mockData = {
  sensors: [
    { id: 1, name: "Sensor 1", sensorValue: 100, calibZero: 10, calibSpand: 20 },
    { id: 2, name: "Sensor 2", sensorValue: 200, calibZero: 30, calibSpand: 40 },
    { id: 3, name: "Sensor 3", sensorValue: 300, calibZero: 50, calibSpand: 60 },
  ],
  intRequest: 0,
};

// Function to simulate dynamic sensor data updates
function updateMockData() {
  mockData.sensors.forEach((sensor) => {
    sensor.sensorValue += Math.floor(Math.random() * 10) - 5; // Randomly change value
    sensor.calibZero += Math.floor(Math.random() * 2) - 1; // Randomly change zero
    sensor.calibSpand += Math.floor(Math.random() * 2) - 1; // Randomly change span
  });
}

// Mock `startPolling` function
function startPolling(onData) {
  console.log("Testing startPolling...");
  setInterval(() => {
    updateMockData(); // Update mock data dynamically
    onData(mockData); // Emit updated data
  }, 1000); // Update every second
}
function triggerInterrupt(sensorId, calibZero, calibSpand) {
    console.log(`Mock triggerInterrupt called with sensorId: ${sensorId}, calibZero: ${calibZero}, calibSpand: ${calibSpand}`);
  }


// Export the mock `startPolling` function for use in `server.js`
export { startPolling,triggerInterrupt, writeCalibrationData };