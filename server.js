import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { startPolling, writeCalibrationData, triggerInterrupt } from './testModbusHandler.js';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.static('public'));

// Handle UI connections via Socket.IO
io.on('connection', (clientSocket) => {
  console.log("UI client connected");

  // Send Modbus data to the UI
  startPolling((modbusData) => {
    io.emit('modbusData', modbusData);
  });

  // Handle calibration data from the UI
  clientSocket.on('calibrationData', async (data) => {
    const { sensorId, calibZero, calibSpand } = data;
    await writeCalibrationData(sensorId, calibZero, calibSpand);
  });

  // Handle interrupt trigger from the UI
  clientSocket.on('triggerInterrupt', async () => {
    await triggerInterrupt();
  });
});

// Start HTTP server on port 3000
httpServer.listen(3000, () => {
  console.log("Server listening on port 3000");
});