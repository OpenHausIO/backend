module.exports = (scope) => {
    scope._ready(({ logger }) => {

        // proceed ssdp item instance
        // deconstruct properties
        //let matchCallbacks = scope.items.map(({ nt, usn, _matches, headers }) => {
        let matchCallbacks = scope.items.map(({ nt, usn, _matches }) => {
            return {
                nt,
                usn,
                _matches,/*
                keys: headers.map((str) => {
                    // NOTE Implement? 
                    // use key/value regex?
                    // /regex header/=/regex value/
                    // [header, ...value] = str.split("=");
                    // How to write/specify regex string?!
                    return new RegExp(str, "i");
                })
                */
            };
        });


        // listen for newly added items
        //scope.events.on("added", ({ nt, usn, _matches, headers }) => {
        scope.events.on("add", ({ nt, usn, _matches }) => {
            matchCallbacks.push({
                nt,
                usn,
                _matches,/*
                keys: headers.map((str) => {
                    // NOTE: See header key/value handling ("NOTE Implement?")
                    return new RegExp(str, "i");
                })*/
            });
        });


        // liste for removed items
        scope.events.on("remove", ({ name, type }) => {
            try {

                let item = matchCallbacks.find((item) => {
                    return item.name === name && item.type === type;
                });

                let index = matchCallbacks.indexOf(item);

                if (index !== -1) {
                    matchCallbacks.splice(index, 1);
                }

            } catch (err) {

                logger.error(err, "Could not remove matchCallback");

            }
        });


        scope.events.on("message", (type, headers, description) => {

            // feedback
            //logger.trace(`Message received on udp socket, type: "${type}"`, headers, scope.items.map((item) => { item._matches }));

            matchCallbacks.forEach(async ({ nt, usn, _matches }, i) => {

                /*
                let match = keys.some((regex) => {
                    return Object.keys(headers).some((key) => {
                        return regex.test(key);
                    });
                });
                */

                //if (headers?.nt === nt || headers?.usn === usn || match) {
                if ((headers?.nt === nt || headers?.usn === usn) && scope.items[i]) {

                    let { timestamps, _id } = scope.items[i];
                    timestamps.announced = Date.now();

                    try {

                        await scope.update(_id, {
                            timestamps: {
                                ...timestamps
                            }
                        });

                    } catch (err) {

                        logger.warn("Could not update timestamps for ssdp announcement", err);

                    } finally {

                        //logger.verbose("Matching ssdp discover found; usn: %s, nt: %s, header regex match: %j", usn, nt, match);
                        logger.verbose("Matching ssdp discover found; usn: %s, nt: %s, header regex match: %j", usn, nt);

                        _matches.forEach((cb) => {
                            cb(type, headers, description);
                        });

                    }

                }

            });

        });

    });
};