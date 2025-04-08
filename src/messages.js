export const MessageTypes = Object.freeze({
    eventUpdate: 0,
    resourceUpdate: 1,
    houseUpgrade: 2,
    gardenUpdate: 3,
    pinpinUpdate: 4,
    pinpinAction: 5,
    skillUnlocked: 6,
});

class MsgList {
    constructor() {
        this.list = [];
        this.freelist = [];
    }

    add(func) {
        const index = this.freelist.pop();
        if (index !== undefined) {
            this.list[index] = func;
            return index;
        }
        return this.list.push(func) - 1;
    }

    remove(index) {
        this.list[index] = null;
        this.freelist.push(index);
    }

    exec(data) {
        for (const item of this.list) {
            if (item) {
                item(data);
            }
        }
    }
}

let bus = [];

for (const _ of Object.entries(MessageTypes)) {
    bus.push(new MsgList());
}

export function sendMsg(type, msg = null) {
    bus[type].exec(msg);
}

export function addListener(type, func) {
    return bus[type].add(func);
}

export function removeListener(type, index) {
    bus[type].remove(index);
}