// models/dataSend.js
export default class DataSend {
    /**
     * @param {number} calibZero - New calibration zero value to send
     * @param {number} calibSpand - New calibration span value to send
     */
    constructor(calibZero, calibSpand) {
      this.calibZero = calibZero;
      this.calibSpand = calibSpand;
    }
  }
  