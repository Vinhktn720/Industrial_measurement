// import { writeCalibrationData } from './modbusHandler.js';

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
    { id: 1, name: 1, sensorValue: 100, calibZero: 10, calibSpand: 20 },
    { id: 2, name: 2, sensorValue: 200, calibZero: 30, calibSpand: 40 },
    { id: 3, name: 3, sensorValue: 300, calibZero: 50, calibSpand: 60 },
  ],
  intRequest: 0,
};

function nameStringToNumber(name) {
  if (name === "Potentiometer" || name === 1) return 1;
  if (name === "Load cell" || name === 2) return 2;
  if (name === "Thermistor" || name === 3) return 3;
  return 0;
}
// Function to simulate dynamic sensor data updates
function updateMockData() {
  mockData.sensors.forEach((sensor) => {
    sensor.sensorValue += Math.floor(Math.random() * 10) - 5; // Randomly change value
  });
}

function getSensorName(nameValue) {
  if (nameValue === 1) return "Potentiometer";
  if (nameValue === 2) return "Load cell";
  if (nameValue === 3) return "Thermistor";
  return "Unknown";
}

// Mock `startPolling` function
function startPolling(onData) {
  console.log("Testing startPolling...");
  setInterval(() => {
    updateMockData(); // Update mock data dynamically
    const dataToSend = {
      ...mockData,
      sensors: mockData.sensors.map(sensor => ({
        ...sensor,
        name: getSensorName(sensor.name) // sensor.name is a number
      }))
    };
    onData(dataToSend); // Emit updated data
  }, 1000); // Update every second
}


function triggerInterrupt(sensorId, calibZero, calibSpand) {
    console.log(`Mock triggerInterrupt called with sensorId: ${sensorId}, calibZero: ${calibZero}, calibSpand: ${calibSpand}`);
  }

function writeCalibrationData(sensorId, calibZero, calibSpand, nameValue) {
  console.log(`Mock writeCalibrationData called with sensorId: ${sensorId}, calibZero: ${calibZero}, calibSpand: ${calibSpand}, name: ${nameValue}`);
  const sensor = mockData.sensors.find(s => s.id === sensorId);
  if (sensor) {
    sensor.calibZero = calibZero;
    sensor.calibSpand = calibSpand;
    if (nameValue !== undefined) {
      sensor.name = nameStringToNumber(nameValue); // always store as number
      console.log(`Sensor ${sensorId} new name (number):`, sensor.name);
    }
  }
  return mockModbusClient.writeSingleRegister(sensorId, calibZero).then(() => {
    return mockModbusClient.writeSingleRegister(sensorId + 1, calibSpand);
  });
}
// Export the mock `startPolling` function for use in `server.js`
export {startPolling,triggerInterrupt, writeCalibrationData };