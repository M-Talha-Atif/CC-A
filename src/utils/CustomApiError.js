// utils/CustomApiError.js
export default class CustomApiError extends Error {
  constructor({ message, status = 500, errorCode = "UNKNOWN_ERROR" }) {
    super(message);
    this.name = "CustomApiError";
    this.status = status;
    this.errorCode = errorCode;

    // Ensure it's serializable
    Object.setPrototypeOf(this, CustomApiError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      errorCode: this.errorCode,
    };
  }
}
