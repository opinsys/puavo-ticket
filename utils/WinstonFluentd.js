"use strict";

var winston = require("winston");
var {createFluentSender} = require("fluent-logger");

class WinstonFluentd extends winston.Transport {

    constructor(options) {
        super(options);
        this.name = "WinstonFluentd";
        options = options || {};

        if (typeof options.tag !== "string") {
            throw new Error("options.tag<String> is required");
        }

        this._fluent = createFluentSender(options.tag, Object.assign({
           host: "localhost",
           port: 24224,
           timeout: 3.0
        }, options.fluentd));

    }

    log(level, msg, meta, cb) {
        var record = {msg, level};
        record[msg] = meta;
        this._fluent.emit(record, cb);
    }
}

module.exports = WinstonFluentd;
