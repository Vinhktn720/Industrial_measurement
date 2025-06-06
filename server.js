import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { startPolling, writeCalibrationData, triggerInterrupt } from './modbusHandler.js';
import os from 'os';

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.static('public'));

// Handle UI connections via Socket.IO
io.on('connection', (clientSocket) => {
  console.log("UI client connected");
  
  // Gửi cấu hình cảm biến ban đầu

  // Send Modbus data to the UI
  startPolling((modbusData) => {
    io.emit('modbusData', modbusData);
    // console.log("Modbus data sent to UI:", modbusData);
  });

  // Handle calibration data from the UI
  clientSocket.on('calibrationData', async (data) => {
    const { sensorId, calibZero, calibSpand, name } = data;

    await writeCalibrationData(sensorId, calibZero, calibSpand, name);
  });

  // Handle interrupt trigger from the UI
  clientSocket.on('triggerInterrupt', async () => {
    await triggerInterrupt();
  });
});

// Start HTTP server on port 3000
httpServer.listen(PORT, HOST, () => {
  const interfaces = os.networkInterfaces();
  console.log(`🟢 Server is listening on:`);

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`👉 http://${iface.address}:${PORT}`);
      }
    }
  }
});