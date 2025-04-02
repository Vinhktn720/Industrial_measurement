// models/dataReceive.js
export default class DataReceive {
    /**
     * @param {number} ID - Unique identifier for the sensor
     * @param {string} sensorName - Name or description of the sensor
     * @param {number} sensorValue - Current sensor value (e.g. ADC reading)
     * @param {number} oldCalibZero - Previously calibrated zero value
     * @param {number} oldCalibSpand - Previously calibrated span value
     */
    constructor(ID, sensorName, sensorValue, oldCalibZero, oldCalibSpand) {
      this.ID = ID;
      this.sensorName = sensorName;
      this.sensorValue = sensorValue;
      this.oldCalibZero = oldCalibZero;
      this.oldCalibSpand = oldCalibSpand;
    }
  }
  