const path = require("path");

// TODO: Make this function obsolete when plugins run in worker threads
module.exports = (mod, envs = ["test"]) => {
    if (mod.parent.filename !== path.resolve(process.cwd(), "index.js")) {

        let msg = `Crossloading detected!\r\n`;
        msg += `Its prohibited to load/import/require: \r\n\r\n`;
        msg += `\t"${mod.filename}"\r\n`;
        msg += `from:\r\n`;
        msg += `\t"${mod.parent.filename}"\r\n`;
        msg += `\r\n`;
        msg += `Componets must be initial loaded from "${path.resolve(process.cwd(), "index.js")}"`;

        if (!envs.includes(process.env.NODE_ENV)) {

            console.error(msg);
            process.exit(800);

        } else {

            //console.error(msg);

        }

    }
};