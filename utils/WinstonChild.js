"use strict";

class WinstonChild {

    constructor(logger, newMeta) {
        this._wrappedLogger = logger._wrappedLogger || logger;
        this._meta = Object.assign({}, logger._meta, newMeta);

        Object.keys(this._wrappedLogger.levels).forEach(level => {
            this[level] = (...args) => this.log(level, ...args);
        });
    }

    log(level, msg, ...rest) {
        var format, meta;

        if (rest.length === 1) {
            [meta] = rest;
        } else {
            [format, meta] = rest;
        }

        meta = Object.assign({}, this._meta, meta);

        if (format) {
            this._wrappedLogger.log(level, msg, format, meta);
        } else {
            this._wrappedLogger.log(level, msg, meta);
        }
    }

}

module.exports = WinstonChild;
