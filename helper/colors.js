function hueToRgb(hue, saturation = 100, brightness = 100) {

    const s = saturation / 100;
    const v = brightness / 100;

    const c = v * s;
    const h = hue / 60;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = v - c;

    let r, g, b;

    if (h >= 0 && h < 1) {
        [r, g, b] = [c, x, 0];
    } else if (h >= 1 && h < 2) {
        [r, g, b] = [x, c, 0];
    } else if (h >= 2 && h < 3) {
        [r, g, b] = [0, c, x];
    } else if (h >= 3 && h < 4) {
        [r, g, b] = [0, x, c];
    } else if (h >= 4 && h < 5) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];

}

module.exports = {
    hueToRgb
};