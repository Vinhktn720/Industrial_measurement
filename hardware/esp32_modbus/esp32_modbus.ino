#include <ModbusIP_ESP8266.h>
#include <WiFi.h>
#include <EEPROM.h>

// WiFi credentials
const char* ssid     = "P619";
const char* password = "hoithangtrinh";

// Create a Modbus TCP Server instance
ModbusIP mb;

// ADC configuration
const int adcPin = 34;    // ADC pin (GPIO34)
uint16_t adcValue = 0;

// EEPROM configuration
#define EEPROM_SIZE 1024
#define EEPROM_ZERO_ADDR 100  // Fixed address for Zero
#define EEPROM_SPAND_ADDR 110 // Fixed address for Spand
int eepromAddr = 200; // Circular buffer for ADC values (start at address 200)

// LED pin for interrupt action
const int ledPin = 2;

uint16_t intReq;
uint16_t Zero;
int16_t Spand;

void setup() {
  Serial.begin(115200);
  
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) {
    digitalWrite(ledPin, HIGH);
    delay(500);
    digitalWrite(ledPin, LOW);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);

  // Read saved Zero and Spand values from EEPROM
  EEPROM.get(EEPROM_ZERO_ADDR, Zero);
  EEPROM.get(EEPROM_SPAND_ADDR, Spand);
  Serial.println("Loaded Calibration Data:");
  Serial.print("Zero: "); Serial.println(Zero);
  Serial.print("Spand: "); Serial.println(Spand);

  // Start the Modbus TCP Server
  mb.server();
  mb.addHreg(0, 0, 4);  // Add 4 holding registers

  // Set initial register values
  mb.Hreg(0, 0);  // sensorValue
  mb.Hreg(1, Zero);  // Load saved Zero
  mb.Hreg(2, Spand); // Load saved Spand
  mb.Hreg(3, 0);  // Interrupt request flag
}

void loop() {
  mb.task();  // Process Modbus requests

  Zero = mb.Hreg(1);
  Spand = mb.Hreg(2);
  intReq = mb.Hreg(3);
  if (intReq != 0) {
    Serial.println("Interrupt request received!");
    
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);

    // Get new calibration values from Modbus registers
  
    // Save new calibration values to EEPROM
    EEPROM.put(EEPROM_ZERO_ADDR, Zero);
    EEPROM.put(EEPROM_SPAND_ADDR, Spand);
    EEPROM.commit();

    Serial.println("Updated Calibration Data:");
    Serial.print("Zero: "); Serial.println(Zero);
    Serial.print("Spand: "); Serial.println(Spand);

    mb.Hreg(3, 0);  // Clear the interrupt flag
  }

  // Read ADC every 1 second
  static unsigned long lastADC = 0;
  if (millis() - lastADC > 10) {
    adcValue = analogRead(adcPin);

    // Save ADC value to EEPROM (circular buffer)
    EEPROM.put(eepromAddr, adcValue);
    eepromAddr += sizeof(adcValue);
    if (eepromAddr >= EEPROM_SIZE) eepromAddr = 200; // Reset buffer if full
    EEPROM.commit();

    mb.Hreg(0, adcValue);  // Update sensor value register

    lastADC = millis();

    // Serial.print("ADC Value: ");
    // Serial.println(adcValue);
    // Serial.print("Zero: "); Serial.println(Zero);
    // Serial.print("Spand: "); Serial.println(Spand);
  }

  delay(10);
}
