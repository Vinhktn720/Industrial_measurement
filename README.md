"# **MODBUS Using ESP32**  

This project demonstrates a **MODBUS TCP Server** running on an **ESP32**, designed for a school project. The system supports a **calibration process for three sensors** and communicates with a **Node.js client** via **WebSockets** for real-time monitoring and control.  

---

## **📂 Project Structure**  


📦 MODBUS-ESP32  
├── 📁 hardware          # ESP32 code (MODBUS server)  
├── 📁 modbus-server     # Node.js client (MODBUS client & WebSocket server)  
├── 📁 public            # Frontend (HTML, CSS, JS)  
└── README.md            # Project documentation  

## 🖥️ ESP32 (MODBUS TCP Server)


    Runs as a MODBUS TCP server to handle sensor data and calibration logic.

    Supports three different sensors with real-time data updates.

    Communicates with the Node.js client over Wi-Fi using the MODBUS TCP protocol.

## 🌐 Node.js Client (MODBUS Client & WebSocket Server)

    Acts as a WebSocket server, forwarding sensor data from the ESP32 to the UI.

    Provides an interactive interface for calibration and monitoring.

## 🚀 Features

✔ MODBUS TCP Server running on ESP32.
✔ Real-time communication between ESP32 and Node.js using WebSockets.
✔ Interactive Web UI to monitor and calibrate sensors.
✔ Three sensor calibration system with zero and span adjustments.
## 📌 Installation & Setup

### 1️⃣ ESP32 Setup


    Flash the ESP32 with the MODBUS server code (/hardware).

    Ensure the ESP32 is connected to your Wi-Fi network.

### 2️⃣ Node.js Client Setup

    Navigate to the modbus-server directory:

cd modbus-server

Install dependencies:

npm install

Start the server:

    npm start

By default, the server runs on http://localhost:3000/.
🖥️ Web UI

Once the Node.js client is running, open your browser and navigate to:
🔗 http://localhost:3000/

You will see a real-time dashboard displaying sensor values and calibration controls.
📷 Screenshots

(Add some UI screenshots here for better visualization!)
📜 License

This project is for educational purposes. Feel free to modify and expand upon it.

🚀 Happy coding!

