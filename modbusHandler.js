import Modbus from 'jsmodbus';
import net from 'net';

const espIP = '192.168.1.25'; // Change to your ESP32 IP address
const modbusPort = 502;
const unitId = 1;

let socket = new net.Socket();
let modbusClient = new Modbus.client.TCP(socket, unitId);
let pollIntervalHandle = null;
let reconnectTimeout = null;
let onDataCallback = null; // Declare onDataCallback globally

// Start polling every 200ms
function startPolling(onData) {
  if (typeof onData !== 'function') {
    throw new Error("startPolling requires a valid callback function");
  }

  onDataCallback = onData; // Save the callback for reconnection use

  if (pollIntervalHandle) clearInterval(pollIntervalHandle);
  pollIntervalHandle = setInterval(async () => {
    try {
      const res = await modbusClient.readHoldingRegisters(0, 10);
      const sensors = [
        {
          id: 1,
          name: "Sensor 1",
          sensorValue: res.response.body.values[0],
          calibZero: res.response.body.values[1],
          calibSpand: res.response.body.values[2]
        },
        {
          id: 2,
          name: "Sensor 2",
          sensorValue: res.response.body.values[3],
          calibZero: res.response.body.values[4],
          calibSpand: res.response.body.values[5]
        },
        {
          id: 3,
          name: "Sensor 3",
          sensorValue: res.response.body.values[6],
          calibZero: res.response.body.values[7],
          calibSpand: res.response.body.values[8]
        }
      ];
      const intRequest = res.response.body.values[9]; // Read interrupt request value
      const modbusData = {sensors, intRequest };
      onData(modbusData); // Emit data to the callback
    } catch (err) {
      console.error("Modbus error:", err.message);
      reconnect();
    }
  }, 100);
}

// Reconnect function
function reconnect() {
  if (pollIntervalHandle) {
    clearInterval(pollIntervalHandle);
    pollIntervalHandle = null;
  }
  if (reconnectTimeout) return;

  socket.destroy();
  socket = new net.Socket();
  modbusClient = new Modbus.client.TCP(socket, unitId);

  socket.on('error', (err) => console.error("Socket error:", err.message));
  socket.on('close', () => reconnect());

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    if (!socket.connecting) {
      try {
        console.log("Attempting to reconnect...");
        socket.connect({ host: espIP, port: modbusPort }, () => {
          console.log("Reconnected to ESP32 Modbus server");
          if (onDataCallback) {
            startPolling(onDataCallback); // Restart polling with the saved callback
          } else {
            console.error("No onData callback defined during reconnection");
          }
        });
      } catch (err) {
        console.error("Reconnection attempt error:", err.message);
      }
    }
  }, 1000);
}

// Initial connection
socket.on('error', (err) => console.error("Socket error:", err.message));
socket.on('close', () => reconnect());
socket.connect({ host: espIP, port: modbusPort }, () => {
  console.log("Connected to ESP32 Modbus server");
});

// Write calibration data
async function writeCalibrationData( sensorId, calibZero, calibSpand ) {
  try {
    // Determine the register offsets based on the sensor ID
    let zeroRegister, spandRegister;

    switch (sensorId) {
      case 1:
        zeroRegister = 1; // Register for Sensor 1 Zero
        spandRegister = 2; // Register for Sensor 1 Span
        break;
      case 2:
        zeroRegister = 4; // Register for Sensor 2 Zero
        spandRegister = 5; // Register for Sensor 2 Span
        break;
      case 3:
        zeroRegister = 7; // Register for Sensor 3 Zero
        spandRegister = 8; // Register for Sensor 3 Span
        break;
      default:
        throw new Error(`Invalid sensor ID: ${sensorId}`);
    }
    await modbusClient.writeSingleRegister(9, 1);
    await modbusClient.writeSingleRegister(zeroRegister, calibZero);
    await modbusClient.writeSingleRegister(spandRegister, calibSpand);
    await modbusClient.writeSingleRegister(9, 1);
    await modbusClient.writeSingleRegister(zeroRegister, calibZero);
    await modbusClient.writeSingleRegister(spandRegister, calibSpand);
    console.log(
      `Calibration data written for Sensor ${sensorId}: Zero=${calibZero}, Span=${calibSpand}`
    );
  } catch (err) {
    console.error("Error writing calibration data:", err.message);
  }
}

// Trigger interrupt
async function triggerInterrupt() {
  try {
    await modbusClient.writeSingleRegister(9, 1);
    console.log("Interrupt triggered on ESP32");
  } catch (err) {
    console.error("Error triggering interrupt:", err.message);
  }
}

export { startPolling, writeCalibrationData, triggerInterrupt };