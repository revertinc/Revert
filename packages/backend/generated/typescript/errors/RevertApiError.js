"use strict";
/**
 * This file was auto-generated by Fern from our API Definition.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevertApiError = void 0;
class RevertApiError extends Error {
    errorName;
    constructor(errorName) {
        super();
        this.errorName = errorName;
        Object.setPrototypeOf(this, RevertApiError.prototype);
    }
}
exports.RevertApiError = RevertApiError;
