import Modbus from 'jsmodbus';
import net from 'net';

const espIP = '192.168.4.1'; // Change to your ESP32 IP address
const modbusPort = 502;
const unitId = 1;

let socket = new net.Socket();
let modbusClient = new Modbus.client.TCP(socket, unitId);
let pollIntervalHandle = null;
let reconnectTimeout = null;
let onDataCallback = null; // Declare onDataCallback globally

function toFloat(lo, hi) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt16BE(hi, 0); // High word first (Modbus big-endian)
  buffer.writeUInt16BE(lo, 2); // Low word second
  return buffer.readFloatBE(0);
}
function nameStringToNumber(name) {
  switch (name.toLowerCase()) {
    case "load cell": return 2;
    case "thermistor": return 1;
    case "potentiometer": return 0;
    default: return 0;
  }
}
function getSensorNameById(sensorId) {
  switch (sensorId) {
    case 2: return "Load cell";
    case 1: return "Thermistor";
    case 0: return "Potentiometer";
    default: return `Sensor ${sensorId}`;
  }
}
function fromFloat(floatValue) {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(floatValue, 0);
  return [buffer.readUInt16BE(2), buffer.readUInt16BE(0)]; // [low, high]
}
async function getSensorNameFromRegisters(sensorId) {
    let nameRegister;
    switch (sensorId) {
        case 1: nameRegister = 19; break;
        case 2: nameRegister = 20; break;
        case 3: nameRegister = 21; break;
        default: return `Sensor ${sensorId}`;
    }
    try {
        const res = await modbusClient.readHoldingRegisters(nameRegister, 1);
        const nameValue = res.response.body.values[0];
        return getSensorNameById(nameValue); // Use getSensorNameById here
    } catch (err) {
        console.error(`Error reading name for sensor ${sensorId}:`, err.message);
        return `Sensor ${sensorId}`;
    }
}
// Start polling every 200ms
function startPolling(onData) {
  if (typeof onData !== 'function') {
    throw new Error("startPolling requires a valid callback function");
  }

  onDataCallback = onData;

  if (pollIntervalHandle) clearInterval(pollIntervalHandle);

  pollIntervalHandle = setInterval(async () => {
    try {
      const res = await modbusClient.readHoldingRegisters(0, 19);
      const values = res.response.body.values;

      const sensors = await Promise.all([0, 6, 12].map(async (offset, i) => {
        const sensorValue = toFloat(values[offset], values[offset + 1]);
        const zero        = toFloat(values[offset + 2], values[offset + 3]);
        const spand       = toFloat(values[offset + 4], values[offset + 5]);
        const name = await getSensorNameFromRegisters(i + 1);
        return {
          id: i + 1,
          name: name,
          sensorValue,
          calibZero: zero,
          calibSpand: spand
        };
      }));

      const intRequest = values[18];

      const modbusData = { sensors, intRequest };
      onDataCallback(modbusData);
    } catch (err) {
      console.error("Modbus polling error:", err.message);
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
function writeCalibrationData(sensorId, calibZero, calibSpand, nameValue) {
  console.log(`Write calibration: Sensor ${sensorId}, Zero: ${calibZero}, Span: ${calibSpand}, Name: ${nameValue}`);
  
  const sensorType = nameStringToNumber(nameValue); // Convert name string to numeric type

  let zeroRegister, spandRegister, nameRegister;

  switch (sensorId) {
    case 1:
      zeroRegister = 2;
      spandRegister = 4;
      nameRegister = 19;
      break;
    case 2:
      zeroRegister = 8;
      spandRegister = 10;
      nameRegister = 20;
      break;
    case 3:
      zeroRegister = 14;
      spandRegister = 16;
      nameRegister = 21;
      break;
    default:
      console.error("Invalid sensor ID:", sensorId);
      return Promise.reject("Invalid sensor ID");
  }

  const [zeroLo, zeroHi] = fromFloat(calibZero);
  const [spandLo, spandHi] = fromFloat(calibSpand);
  console.log(`Write calibration: Sensor ${sensorId}, Zero: ${calibZero}, Span: ${calibSpand}, Name: ${sensorType}`);

  return Promise.all([
    modbusClient.writeMultipleRegisters(zeroRegister, [zeroLo, zeroHi]).catch(err => {
      console.error(`Error writing zero register for sensor ${sensorId}:`, err);
      throw err; // Re-throw the error to reject the Promise.all
    }),
    modbusClient.writeMultipleRegisters(spandRegister, [spandLo, spandHi]).catch(err => {
      console.error(`Error writing spand register for sensor ${sensorId}:`, err);
      throw err; // Re-throw the error to reject the Promise.all
    }),
    modbusClient.writeSingleRegister(nameRegister, sensorType).catch(err => {
      console.error(`Error writing name register for sensor ${sensorId}:`, err);
      throw err; // Re-throw the error to reject the Promise.all
    }),
    modbusClient.writeSingleRegister(18, 1).catch(err => {
      console.error(`Error writing trigger register for sensor ${sensorId}:`, err);
      throw err; // Re-throw the error to reject the Promise.all
    })
  ]);
}


// Trigger interrupt
async function triggerInterrupt() {
  try {
    await modbusClient.writeSingleRegister(18, 1);
    console.log("Interrupt triggered");
  } catch (err) {
    console.error("Error triggering interrupt:", err.message);
  }
}

export { startPolling, writeCalibrationData, triggerInterrupt };