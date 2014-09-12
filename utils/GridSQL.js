"use strict";
var Promise = require("bluebird");
var stream = require("stream");
var debug = require("debug")("app/utils/GridSQL");
var util = require("util");

function Row2Buffer(){
    stream.Transform.call(this);
    this._writableState.objectMode = true;
    this._readableState.objectMode = false;
}

util.inherits(Row2Buffer, stream.Transform);

Row2Buffer.prototype._transform = function(row, encoding, cb) {
    this.push(row.chunk);
    cb();
};

function GridSQL(opts) {
    if (!(this instanceof GridSQL)) return new GridSQL(opts);

    this.knex = opts && opts.knex;
    this.tableName = (opts && opts.tableName) || "chunks";
    this.chunkSize = (opts && opts.chunkSize) || 261120;

    if (!this.knex) throw new Error("Missing options.knex");
}

GridSQL.prototype.read = function(fileId) {

    debug("reading %s", fileId);

    var rowStream = this.knex.select("chunk")
    .from(this.tableName)
    .where({ fileId: fileId })
    .orderBy("sequence", "asc")
    .stream();

    return rowStream.pipe(new Row2Buffer());

};


GridSQL.prototype.write = function(fileId, readable, opts) {
    var knex = this.knex;
    var tableName = this.tableName;
    debug("Writing %s", fileId);

    var tableChunkSize = (opts && opts.chunkSize) || this.chunkSize;


    if (!knex) throw new Error("Missing options.knex");


    var sequence = 0;
    var bytesWritten = 0;

    return knex.transaction(function(t) {
        var inserts = [];

        function read() {
            var chunk;
            while (null !== (chunk = readable.read(tableChunkSize))) {
                sequence += 1;
                bytesWritten += chunk.length;

                debug(
                    "got %s chunk of %s (%s) of bytes for %s",
                    sequence, chunk.length, bytesWritten
                );

                inserts.push(t.insert({
                    fileId: fileId,
                    chunk: chunk,
                    sequence: sequence
                }).into(tableName));
            }
        }

        readable.on("readable", read);
        read();

        return new Promise(function(resolve, reject){
            readable.on("error", reject);
            readable.on("end", resolve);
        })
        .then(function() {
            return Promise.all(inserts);
        });
    })
    .then(function() {
        return {
            bytesWritten: bytesWritten,
            chunkCount: sequence
        };
    });

};

module.exports = GridSQL;
