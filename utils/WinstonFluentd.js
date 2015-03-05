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

        this._fluent.on("error", (err) => {
            console.error("Fluent error: " + err.message);
        });

    }

    log(level, msg, meta, cb) {
        var record = {msg, level};
        record[msg] = meta;
        record.timestamp = new Date();
        this._fluent.emit(record, (err) => {
            if (err) {
                console.error("Failed to connect fluentd: " + err.message);
            }
            cb();
        });
    }
}

module.exports = WinstonFluentd;
