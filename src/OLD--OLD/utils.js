export function lerp(v0, v1, alpha) {
    return (1 - alpha) * v0 + alpha * v1;
}

export function toMilliseconds(seconds) {
    return seconds * 1000.0;
}

export function forEachCond(arr) {
    for (let i = 0; i < arr.length; ++i) {
        arr[i].step();
        if (arr[i].unlocked()) {
            arr[i] = arr[arr.length - 1];
            arr.pop();
            --i;
        }
    }
}

/*
export function getResourceName(id, count) {
    const name = Resources.name(id);
    if (count <= 1) {
        const singular = Resources.get(id, "singular", null);
        return singular ? singular : name;
    }
    return name;
}

export function valueString(id, count) {
    return `${count > 0 ? "+" : ""}${formatNumber(count)} ${getResourceName(id, Math.abs(count))}`;
}
*/
