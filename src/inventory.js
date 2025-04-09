import { MessageTypes, sendMsg } from "src/messages.js"
import { makeEnum } from "src/utils/enum.js";

export const Resources = makeEnum({
    wood: {
        name: "wood",
    },
    seeds: {
        name: "seeds",
        singular: "seed",
    },
    wheat: {
        name: "wheat",
        value: 0.2,
    },
    stone: {
        name: "stone",
        value: 0.01,
    },
    money: {
        name: "coins",
        singular: "coin",
    },
})


export class Resource {
    constructor(id, count, total) {
        this.id = id;
        this.count = count;
        this.total = total;
        this.value = Resources.get(id, "value", 0);
    }

    set(count) {
        this.count = count;
        this._sendMessage();
    }

    add(n) {
        this.total += n;
        this.count += n;
        this._sendMessage();
    }

    remove(n) {
        this.count -= n;
        if (this.count < 0) console.error(`count is < 0: ${Resources.name(this.id)}: ${this.count}`);
        this._sendMessage();
    }

    _sendMessage() {
        sendMsg(MessageTypes.resourceUpdate, { id: this.id, count: this.count });
    }
};

export class Inventory {
    constructor() {
        this.resources = [];
        for (const [id, _] of Resources.each()) {
            this.resources.push(new Resource(id, 0, 0));
        }
    }

    init() {
        
    }

    getSaveData() {
        let data = {};
        for (const id in this.resources) {
            const res = this.resources[id];
            if (res.total > 0) {
                data[id] = {
                    count: res.count,
                    total: res.total,
                }
            }
        }
        return data;
    }

    loadSaveData(data) {
        for (const [id, item] of Object.entries(data)) {
            const res = this.resources[id];
            res.total = item.total;
            res.set(item.count);
        }
    }

    add(id, count) {
        this.resources[id].add(count);
    }

    remove(id, count) {
        this.resources[id].remove(count);
    }

    countOf(id) {
        return this.resources[id].count;
    }

    totalOf(id) {
        return this.resources[id].total;
    }

    buy(id, count = 1) {
        const value = this.resources[id].value;
        this.resources[Resources.money].remove(value * count);
        this.resources[id].add(count);
    }

    sell(id, count = 1) {
        const value = this.resources[id].value;
        this.resources[id].remove(count);
        this.resources[Resources.money].add(value * count);
    }
}