let bus = {
    list: [],
    freelist: [],
};

export function sendMessage(msg, payload = null) {
    for (const item of bus.list) {
        if (item !== null) {
            item(msg, payload);
        }
    }
}

export function addListener(func) {
    const index = bus.freelist.pop();
    if (index !== undefined) {
        bus.list[index] = func;
        return index;
    }
    return bus.list.push(func) - 1;
}

export function removeListener(index) {
    bus.list[index] = null;
    bus.freelist.push(index);
}