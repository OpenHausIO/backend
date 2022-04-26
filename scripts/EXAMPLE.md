# Interface bridging

Bridge a interface without using the [connector](https://github.com/OpenHausIO/connector) application, you can simple the bridge scripts from this folder:
- tcp
- udp

To Keep the commands executing infintly while the backend restarts:

```sh
while true; do "<cmd>"; sleep 1; done;
```

### TCP
```sh
./bridge.tcp.js --device="6042785432c51e3e98e7acc0" --interface="6042785432c51e3e98e7acc1"
```

### UDP
```sh
./bridge.udp.js --device="625c330e23ed9311d25efbee" --interface="625c330e23ed9311d25efbef"
```