const GzipExtractStream = require("./class.extractStream.js");
const GzipInjectStream = require("./class.injectStream.js");

/**
 * Klasse zum Manipulieren von GZIP Extra Fields
 */
module.exports = class GzipMetadata {
    /**
     * @param {Buffer} buffer - GZIP-komprimierte Daten
     */
    constructor(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError("Argument muss ein Buffer sein");
        }

        // GZIP Magic Number validieren
        if (buffer[0] !== 0x1f || buffer[1] !== 0x8b) {
            throw new Error("Keine gültige GZIP-Datei");
        }

        const compressionMethod = buffer[2];
        if (compressionMethod !== 8) {
            throw new Error("Nur Deflate-komprimierte GZIPs werden unterstützt");
        }

        this.buffer = buffer;
    }

    /**
     * Setzt Extra Fields im GZIP-Header (überschreibt alle existierenden)
     * @param {Object} fields - Extra Fields als Objekt mit String-Keys (2 Zeichen) oder numerischen Keys
     * @returns {GzipMetadata} - Neue Instanz mit modifizierten Daten
     */
    inject(fields) {
        // Header-Informationen extrahieren
        let flags = this.buffer[3];
        const mtime = this.buffer.slice(4, 8);
        const xfl = this.buffer[8];
        const os = this.buffer[9];

        // Position nach dem Basis-Header
        let position = 10;

        // Existierende Extra Fields überspringen (werden überschrieben)
        if (flags & 0x04) { // FEXTRA Flag gesetzt
            const extraLength = this.buffer[position] | (this.buffer[position + 1] << 8);
            position += 2 + extraLength;
        }

        // Optional: FNAME überspringen
        if (flags & 0x08) {
            while (this.buffer[position++] !== 0);
        }

        // Optional: FCOMMENT überspringen
        if (flags & 0x10) {
            while (this.buffer[position++] !== 0);
        }

        // Optional: FHCRC überspringen
        if (flags & 0x02) {
            position += 2;
        }

        // Komprimierte Daten + Footer (CRC32 + ISIZE)
        const compressedData = this.buffer.slice(position);

        // Neue Extra Fields erstellen (alte werden verworfen)
        const newExtraFields = GzipMetadata.createExtraFields(fields);

        // FEXTRA Flag setzen
        flags |= 0x04;

        // Neuen Header zusammenbauen
        const extraLengthBytes = Buffer.alloc(2);
        extraLengthBytes.writeUInt16LE(newExtraFields.length, 0);

        const newHeader = Buffer.concat([
            Buffer.from([0x1f, 0x8b, this.buffer[2], flags]),
            mtime,
            Buffer.from([xfl, os]),
            extraLengthBytes,
            newExtraFields
        ]);

        const newBuffer = Buffer.concat([newHeader, compressedData]);
        return new GzipMetadata(newBuffer);
    }

    /**
     * Extrahiert Extra Fields aus dem GZIP-Header
     * @returns {Object} - Extra Fields als Objekt { id: Buffer, ... }
     */
    extract() {
        const flags = this.buffer[3];
        const fields = {};

        // Prüfen ob FEXTRA Flag gesetzt ist
        if (!(flags & 0x04)) {
            return fields; // Keine Extra Fields vorhanden
        }

        let position = 10;
        const extraLength = this.buffer[position] | (this.buffer[position + 1] << 8);
        position += 2;

        const extraEnd = position + extraLength;

        // Extra Fields parsen
        while (position < extraEnd) {
            if (position + 4 > extraEnd) {
                throw new Error("Unvollständiges Extra Field");
            }

            const fieldID = this.buffer.readUInt16LE(position);
            const dataLength = this.buffer.readUInt16LE(position + 2);
            position += 4;

            if (position + dataLength > extraEnd) {
                throw new Error("Extra Field Daten überschreiten die angegebene Länge");
            }

            const fieldData = this.buffer.slice(position, position + dataLength);
            fields[fieldID] = fieldData;

            position += dataLength;
        }

        return fields;
    }

    /**
     * Extrahiert Extra Fields und konvertiert IDs zu Strings
     * @returns {Object} - Extra Fields als Objekt { "AB": Buffer, ... }
     */
    extractAsStrings() {
        const numericFields = this.extract();
        const stringFields = {};

        for (const [id, value] of Object.entries(numericFields)) {
            const numId = Number(id);
            const stringId = GzipMetadata._fieldIDToString(numId);
            stringFields[stringId] = value;
        }

        return stringFields;
    }

    /**
     * Gibt den aktuellen Buffer zurück
     * @returns {Buffer}
     */
    toBuffer() {
        return this.buffer;
    }

    /**
     * Erstellt einen Transform-Stream zum Extrahieren von Extra Fields
     * @returns {GzipExtractStream} - Transform Stream, der "header" Event emittiert
     */
    static createExtractStream() {
        return new GzipExtractStream();
    }

    /**
     * Erstellt einen Transform-Stream zum Injizieren von Extra Fields
     * @param {Object} fields - Extra Fields zum Setzen
     * @returns {GzipInjectStream} - Transform Stream
     */
    static createInjectStream(fields) {
        return new GzipInjectStream(fields);
    }

    /**
     * Konvertiert String-ID (2 Zeichen) in numerische ID
     * @param {string} str - Zwei-Zeichen-String
     * @returns {number} - 16-bit ID
     * @private
     */
    static _stringToFieldID(str) {
        if (typeof str !== "string" || str.length !== 2) {
            throw new TypeError("Extra Field ID muss ein String mit genau 2 Zeichen sein");
        }
        return str.charCodeAt(0) | (str.charCodeAt(1) << 8);
    }

    /**
     * Konvertiert numerische ID in String-ID (2 Zeichen)
     * @param {number} id - 16-bit ID
     * @returns {string} - Zwei-Zeichen-String
     * @private
     */
    static _fieldIDToString(id) {
        if (id < 0 || id > 65535) {
            throw new RangeError("Field ID muss zwischen 0 und 65535 liegen");
        }
        const char1 = String.fromCharCode(id & 0xff);
        const char2 = String.fromCharCode((id >> 8) & 0xff);
        return char1 + char2;
    }

    /**
     * Erstellt Extra Field Bytes aus einem Objekt
     * @param {Object} fields - Extra Fields (Key: String oder Number, Value: String oder Buffer)
     * @returns {Buffer} - Serialisierte Extra Fields
     * @private
     */
    static createExtraFields(fields) {
        const fieldBuffers = [];

        for (const [key, value] of Object.entries(fields)) {
            // ID normalisieren
            const fieldID = typeof key === "string" ? GzipMetadata._stringToFieldID(key) : Number(key);

            // Validierung: ID muss im Bereich 256-65535 liegen
            if (fieldID < 256 || fieldID > 65535) {
                throw new RangeError(`Extra Field ID muss zwischen 256 und 65535 liegen (erhalten: ${fieldID})`);
            }

            // Daten als Buffer vorbereiten
            const dataBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value);

            if (dataBuffer.length > 65535) {
                throw new RangeError(`Extra Field Daten zu groß (max. 65535 Bytes): ${dataBuffer.length}`);
            }

            // Extra Field Format: SI1 (1 byte) | SI2 (1 byte) | LEN (2 bytes, LE) | Data (LEN bytes)
            const fieldBuffer = Buffer.alloc(4 + dataBuffer.length);
            fieldBuffer.writeUInt16LE(fieldID, 0);        // SI1 + SI2
            fieldBuffer.writeUInt16LE(dataBuffer.length, 2); // LEN
            dataBuffer.copy(fieldBuffer, 4);              // Data

            fieldBuffers.push(fieldBuffer);
        }

        return Buffer.concat(fieldBuffers);
    }
};