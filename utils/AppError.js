class AppError extends Error {
    constructor(message, statusCode, extra = {}) {
        super(message);
        this.statusCode = statusCode;
        Object.assign(this, extra);
    }
}

export default AppError;
