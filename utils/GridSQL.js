"use strict";
var Promise = require("bluebird");
var stream = require("stream");
var debug = require("debug")("app:utils/GridSQL");
var util = require("util");

/**
 * MongoDB's GridFS inspired data storage for Knex. The given file is saved to
 * multiple binary columns in order to enable proper file streaming.
 *
 * GridSQL works like a key value store. All files must be written with an
 * unique file id.
 *
 * @namespace utils
 * @class GridSQL
 * @constructor
 * @param {Object} options
 * @param {Object} options.knex Knex instance
 * @param {Object} [options.chunkSize=(1024*255)] Chunk size
 * @param {Object} [options.tableName=chunks] Table name
 */
function GridSQL(options) {
    if (!(this instanceof GridSQL)) return new GridSQL(options);

    this.knex = options && options.knex;
    this.tableName = (options && options.tableName) || "chunks";
    this.chunkSize = (options && options.chunkSize) || (1024 * 255);

    if (!this.knex) throw new Error("Missing options.knex");
}

/**
 * Read file as a node.js readable stream.
 *
 * This method has a little bug https://github.com/tgriesser/knex/issues/484
 *
 * @method read
 * @param {String} fileId
 * @return {stream.Readable}
 */
GridSQL.prototype.read = function(fileId) {

    debug("reading %s", fileId);

    var rowStream = this.knex.select("chunk")
    .from(this.tableName)
    .where({ fileId: fileId })
    .orderBy("sequence", "asc")
    .stream({highWaterMark: 5});

    return rowStream.pipe(new Row2Buffer());
};


/**
 * Write node.js readable stream database with a unique file id
 *
 * @method write
 * @param {String} fileId
 * @param {stream.Writable} readable
 * @param {Object} [options]
 * @param {Object} [options.chunkSize] Custom chunks size for this file
 * @return {Bluebird.Promise} The returned promise is resolved when the
 * readable stream is fully saved to the database
 */
GridSQL.prototype.write = function(fileId, readable, options) {
    var knex = this.knex;
    var tableName = this.tableName;
    debug("Writing %s", fileId);

    var tableChunkSize = (options && options.chunkSize) || this.chunkSize;


    if (!knex) throw new Error("Missing options.knex");


    var sequence = 0;
    var bytesWritten = 0;

    return knex.transaction(function(t) {
        var current = Promise.resolve();

        function read() {
            if (current.isPending()) return;

            var chunk = readable.read(tableChunkSize);
            if (chunk === null) return;

            sequence += 1;
            bytesWritten += chunk.length;

            debug(
                "Got %s chunk of %s (%s) of bytes for %s",
                sequence, chunk.length, bytesWritten, fileId
            );

            current = t.insert({
                fileId: fileId,
                chunk: chunk,
                sequence: sequence
            })
            .into(tableName)
            .then(function() {
                debug("Chunk %s written for %s", sequence, fileId);
                process.nextTick(read);
            });

        }

        readable.on("readable", read);
        read();

        return new Promise(function(resolve, reject){
            readable.on("error", reject);
            readable.on("end", resolve);
        })
        .then(function() {
            return current;
        });
    })
    .then(function() {
        return {
            bytesWritten: bytesWritten,
            chunkCount: sequence
        };
    });

};

/**
 * Transform stream to transform Knex row objects to binary stream
 *
 * @private
 * @class Row2Buffer
 */
function Row2Buffer(){
    stream.Transform.call(this);
    this._writableState.objectMode = true;
    this._readableState.objectMode = false;
}

util.inherits(Row2Buffer, stream.Transform);

Row2Buffer.prototype._transform = function(row, encoding, cb) {
    if (!row || !Buffer.isBuffer(row.chunk)) {
        var err = new Error("Invalid GridSQL row");
        err.row = row;
        return cb(err);
    }

    debug("Reading chunk %s byte chunk", row.chunk.length);
    this.push(row.chunk);
    cb();
};


module.exports = GridSQL;
