const { Transform } = require("stream");
const GzipMetadata = require("./class.gzipMetadata.js");

/**
 * Transform Stream zum Injizieren von GZIP Extra Fields
 */
module.exports = class InjectStream extends Transform {
    constructor(fields) {
        super();
        this._fields = fields;
        this._buffer = Buffer.alloc(0);
        this._headerProcessed = false;
    }

    _transform(chunk, encoding, callback) {
        try {
            if (!this._headerProcessed) {
                // Chunks sammeln bis wir genug für den Header haben
                this._buffer = Buffer.concat([this._buffer, chunk]);

                // Mindestens 10 Bytes für Basis-Header
                if (this._buffer.length < 10) {
                    return callback();
                }

                // GZIP validieren
                if (this._buffer[0] !== 0x1f || this._buffer[1] !== 0x8b) {
                    return callback(new Error("Keine gültige GZIP-Datei"));
                }

                if (this._buffer[2] !== 8) {
                    return callback(new Error("Nur Deflate-komprimierte GZIPs werden unterstützt"));
                }

                let flags = this._buffer[3];
                const mtime = this._buffer.slice(4, 8);
                const xfl = this._buffer[8];
                const os = this._buffer[9];
                let position = 10;

                // Existierende Extra Fields überspringen
                if (flags & 0x04) {
                    if (this._buffer.length < position + 2) {
                        return callback(); // Warten auf mehr Daten
                    }
                    const extraLength = this._buffer[position] | (this._buffer[position + 1] << 8);
                    position += 2 + extraLength;

                    if (this._buffer.length < position) {
                        return callback(); // Warten auf mehr Daten
                    }
                }

                // FNAME überspringen
                if (flags & 0x08) {
                    while (position < this._buffer.length && this._buffer[position++] !== 0);
                    if (position > this._buffer.length) {
                        return callback(); // Warten auf mehr Daten
                    }
                }

                // FCOMMENT überspringen
                if (flags & 0x10) {
                    while (position < this._buffer.length && this._buffer[position++] !== 0);
                    if (position > this._buffer.length) {
                        return callback(); // Warten auf mehr Daten
                    }
                }

                // FHCRC überspringen
                if (flags & 0x02) {
                    if (this._buffer.length < position + 2) {
                        return callback(); // Warten auf mehr Daten
                    }
                    position += 2;
                }

                // Neue Extra Fields erstellen
                //const gzipHelper = new GzipMetadata(this._buffer.slice(0, 10));
                //const newExtraFields = gzipHelper._createExtraFields(this._fields);
                const newExtraFields = GzipMetadata.createExtraFields(this._fields);

                // FEXTRA Flag setzen
                flags |= 0x04;

                // Neuen Header bauen
                const extraLengthBytes = Buffer.alloc(2);
                extraLengthBytes.writeUInt16LE(newExtraFields.length, 0);

                const newHeader = Buffer.concat([
                    Buffer.from([0x1f, 0x8b, this._buffer[2], flags]),
                    mtime,
                    Buffer.from([xfl, os]),
                    extraLengthBytes,
                    newExtraFields
                ]);

                // Neuen Header pushen
                this.push(newHeader);

                // Rest der Daten pushen
                this.push(this._buffer.slice(position));
                this._buffer = Buffer.alloc(0);
                this._headerProcessed = true;
            } else {
                // Header bereits verarbeitet, einfach durchreichen
                this.push(chunk);
            }

            callback();
        } catch (err) {
            callback(err);
        }
    }

    _flush(callback) {
        if (this._buffer.length > 0) {
            this.push(this._buffer);
        }
        callback();
    }
};