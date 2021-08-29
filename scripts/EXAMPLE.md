# Interface bridging

```sh
while true; do "echo <cmd>"; sleep 1; done;
```

## ZigBee Gateway
```sh
./bridge.tcp.js --device="6042785432c51e3e98e7acc0" --interface="6042785432c51e3e98e7acc1" 
./bridge.ws.js --device="6042785432c51e3e98e7acc0" --interface="6042785432c51e3e98e7acc2"
```
> API key: DC5F27B237

## AV - Receiver
```sh
./bridge.tcp.js --device="603fe5d18791152879a9babc" --interface="603fe5d18791152879a9babd"
```

## FritzBox
```sh
./bridge.tcp.js --device="604677f6d509b3305ddbb5e9" --interface="604677f6d509b3305ddbb5ea"
```

## Samsung TV (Wohnzimmer) ✓
```sh
./bridge.ws.js --device="60467a1b86dce832aa0b4a67" --interface="60467a1b86dce832aa0b4a68"
```

## Samsung TV (Schlafzimmer) ✗ WHAT?!?!!?!?
```sh
./bridge.ws.js --device="60467a25ced1b432c48dfbbb" --interface="60467a25ced1b432c48dfbbc"
./bridge.tcp.js --device="60467a25ced1b432c48dfbbb" --interface="60467a25ced1b432c48dfbbc"
```

## Lowboard LED Strip
```sh
./bridge.ws.js --device="604687cd3f28e7432646dc22" --interface="604687cd3f28e7432646dc23"
```


# Discover
## ssdp
> http://www.upnp-hacks.org/upnp.html
> https://en.wikipedia.org/wiki/Simple_Service_Discovery_Protocol
> https://williamboles.me/discovering-whats-out-there-with-ssdp/
```sh
./bridge.udp.js --ssdp --multicast --destination="239.255. 255.250" --port="1900" --url=http://localhost:8080/api/ssdp
```

## dhcp
> https://de.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol
```sh
./bridge.udp.js --dhcp --broadcast --destination="255.255.255.255" --port="67" --url=http://localhost:8080/api/discover/dhcp
```