const { Transform } = require("stream");


/**
 * Transform Stream zum Extrahieren von GZIP Extra Fields
 * Emittiert "header" Event mit { fields, buffer } nach dem Parsen
 */
module.exports = class ExtractStream extends Transform {
    constructor() {
        super();
        this._buffer = Buffer.alloc(0);
        this._headerParsed = false;
        this._headerLength = 0;
    }

    _transform(chunk, encoding, callback) {
        try {
            if (!this._headerParsed) {
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

                const flags = this._buffer[3];
                let position = 10;

                // Extra Fields extrahieren
                const fields = {};

                if (flags & 0x04) {
                    if (this._buffer.length < position + 2) {
                        return callback(); // Warten auf mehr Daten
                    }

                    const extraLength = this._buffer[position] | (this._buffer[position + 1] << 8);
                    position += 2;

                    if (this._buffer.length < position + extraLength) {
                        return callback(); // Warten auf mehr Daten
                    }

                    const extraEnd = position + extraLength;
                    while (position < extraEnd) {

                        //const fieldID = this._buffer.readUInt16LE(position);
                        const fieldID = this._buffer.slice(position, position + 2).toString("ascii");
                        const dataLength = this._buffer.readUInt16LE(position + 2);
                        position += 4;

                        const fieldData = this._buffer.slice(position, position + dataLength);
                        fields[fieldID] = fieldData;

                        position += dataLength;
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

                this._headerLength = position;
                this._headerParsed = true;

                // Header Event emittieren
                this.emit("header", {
                    fields,
                    headerBuffer: this._buffer.slice(0, position)
                });

                // Gesamten Buffer durchreichen
                this.push(this._buffer);
                this._buffer = Buffer.alloc(0);
            } else {
                // Header bereits geparst, einfach durchreichen
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