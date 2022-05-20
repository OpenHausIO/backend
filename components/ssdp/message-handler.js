module.exports = (scope) => {
    scope._ready(({ logger }) => {

        // proceed ssdp item instance
        // deconstruct properties
        let wanted = scope.items.map(({ nt, usn, _matches, headers }) => {
            return {
                nt,
                usn,
                _matches,
                keys: headers.map((str) => {
                    return new RegExp(str, "i");
                })
            };
        });


        // listen for newly added items
        scope.events.on("added", ({ nt, usn, _matches, headers }) => {
            wanted.push({
                nt,
                usn,
                _matches,
                keys: headers.map((str) => {
                    return new RegExp(str, "i");
                })
            });
        });


        scope.events.on("message", (type, headers, description) => {

            // feedback
            logger.trace(`Message received on udp socket, type: "${type}"`, headers);

            wanted.forEach(async ({ nt, usn, _matches, keys }, i) => {

                let match = keys.some((regex) => {
                    return Object.keys(headers).some((key) => {
                        return regex.test(key);
                    });
                });

                if (headers?.nt === nt || headers?.usn === usn || match) {

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

                        logger.verbose("Matching ssdp discover found; usn: %s, nt: %s, header regex match: %j", usn, nt, match);

                        _matches.forEach((cb) => {
                            cb(type, headers, description);
                        });

                    }

                }

            });

        });

    });
};