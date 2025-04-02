import Modbus from 'jsmodbus';
import net from 'net';

const espIP = '192.168.1.24'; // Change to your ESP32 IP address
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
      const res = await modbusClient.readHoldingRegisters(0, 4);
      const sensorValue = res.response.body.values[0];
      const calibZero = res.response.body.values[1];
      const calibSpand = res.response.body.values[2];
      const intRequest = res.response.body.values[3];
      const modbusData = { sensorValue, calibZero, calibSpand, intRequest };
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
async function writeCalibrationData(calibZero, calibSpand) {
  try {
    await modbusClient.writeSingleRegister(3, 1);
    await modbusClient.writeSingleRegister(1, calibZero);
    await modbusClient.writeSingleRegister(2, calibSpand);
    await modbusClient.writeSingleRegister(3, 1);
    await modbusClient.writeSingleRegister(1, calibZero);
    await modbusClient.writeSingleRegister(2, calibSpand);
    console.log("Calibration data written:", calibZero, calibSpand);
  } catch (err) {
    console.error("Error writing calibration data:", err.message);
  }
}

// Trigger interrupt
async function triggerInterrupt() {
  try {
    await modbusClient.writeSingleRegister(3, 1);
    console.log("Interrupt triggered on ESP32");
  } catch (err) {
    console.error("Error triggering interrupt:", err.message);
  }
}

export { startPolling, writeCalibrationData, triggerInterrupt };