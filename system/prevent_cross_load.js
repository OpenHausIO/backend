const path = require("path");

module.exports = (mod) => {
    if (!["production", "test"].includes(process.env.NODE_ENV)) {
        if (mod.parent.filename !== path.resolve(process.cwd(), "index.js")) {
            try {

                let msg = `Crossloading detected. Abort!\r\n`;
                msg += `Its prohibited to load/import/require: \r\n\r\n`;
                msg += `\t"${mod.filename}"\r\n`;
                msg += `from:\r\n`;
                msg += `\t"${mod.parent.filename}"\r\n`;
                msg += `\r\n`;
                msg += `Componets must be initial loaded from "${path.resolve(process.cwd(), 'index.js')}"`

                throw new Error(msg);

            } catch (err) {

                console.error(err);

            } finally {

                process.exit(800);

            }
        }
    }
};