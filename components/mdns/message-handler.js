const { encode, RECURSION_DESIRED } = require("dns-packet");

module.exports = (scope) => {
    scope._ready(({ logger }) => {

        // proceed mdns item instance
        // deconstruct properties
        let matchCallbacks = scope.items.map(({ name, type, _matches }) => {
            return {
                name,
                type,
                _matches
            };
        });


        // listen for newly added items
        scope.events.on("add", ({ name, type, _matches }) => {
            matchCallbacks.push({
                name,
                type,
                _matches
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


        scope.events.on("connected", (ws) => {

            let questions = scope.items.map(({ type, name }) => {
                return {
                    type,
                    name
                };
            });

            let query = encode({
                type: "query",
                id: 1,
                flags: RECURSION_DESIRED,
                questions
            });

            logger.debug("Connected, send query", query, questions);

            ws.send(query);

        });


        scope.events.on("message", (packet, message) => {

            // feedback
            logger.trace("Message received on udp socket, record:", packet, "message: ", message);

            if (packet.type === "response") {
                packet.answers.forEach((record) => {
                    matchCallbacks.forEach(async ({ name, type, _matches }, i) => {

                        // create regex from db data
                        // allow wildcards writen as * in items
                        name = name.replace(/\./, "\\.");
                        name = name.replace("*", ".*");
                        let rexp = new RegExp(name);

                        if (type === record.type && rexp.test(record.name)) {

                            logger.verbose("Matching recourd found", record, name, type);

                            let { timestamps, _id } = scope.items[i];
                            timestamps.announced = Date.now();

                            // update mdns item timestamps
                            await scope.update(_id, {
                                timestamps: {
                                    ...timestamps
                                }
                            });

                            _matches.forEach((cb) => {
                                cb(record);
                            });

                        } else {

                            // Do nothing if nothing matches
                            //console.log(">> NON << MAchting record type");

                        }

                    });
                });
            } else {

                logger.trace("Other packet type then response received", packet.type);

            }

        });

    });
};