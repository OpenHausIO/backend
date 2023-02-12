// https://mosquitto.org/man/mosquitto_passwd-1.html#idm102

module.exports = (version = 3) => {
    if (version >= 5) {

        return {
            0: "Success",
            128: "Unspecified error",
            129: "Malformed packet",
            130: "Protocol error",
            131: "Implementation specific error",
            132: "Unsupported protocol version",
            133: "Client ID not valid",
            134: "Bad username or password",
            135: "Not authorized",
            136: "Server unavailable",
            137: "Server busy",
            138: "Banned",
            139: "Server shutting down",
            140: "Bad authentication method",
            141: "Keep alive timeout",
            142: "Session taken over",
            143: "Topic filter invalid",
            144: "Topic name invalid",
            145: "",    // unused
            146: "",    // unused
            147: "Receive maximum exceeded",
            148: "Topic alias invalid",
            149: "Packet too large",
            150: "",    // unused
            151: "Quota exceeded",
            152: "Administrative action",
            153: "Payload format invalid",
            154: "Retain not supported",
            155: "QoS not supported",
            156: "Use another server",
            157: "Server moved",
            158: "Shared subscriptions not supported",
            159: "Connection rate exceeded",
            160: "Maximum connect time",
            161: "Subscription IDs not supported",
            162: "Wildcard subscriptions not supported",
        };

    } else if (version >= 3) {

        return {
            0: "Success",
            1: "Connection refused: Bad protocol version",
            2: "Connection refused: Identifier rejected",
            3: "Connection refused: Identifier rejected",
            4: "Connection refused: Bad username/password",
            5: "Connection refused: Not authorized"
        };

    } else {

        throw new Error(`Unsupported protocol version "${version}"`);

    }
};