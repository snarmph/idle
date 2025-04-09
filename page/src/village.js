import { makeEnum } from "src/utils/enum.js"
import { MessageTypes, sendMsg } from "src/messages.js"
import { getRandomInt } from "src/utils/rand.js"
import { game } from "src/game.js"
import * as actions from "src/actions.js"
import { randomItem } from "./utils/rand.js"

export const PinpinType = makeEnum({
    base: {
        name: "Stupid Pinpin",
        action_name: "",
        value: 5,
        speed: 5.0,
    },
    explorer: {
        name: "Explorer Pinpin",
        action_name: "explore the wilderness",
        value: 10,
        speed: 1.0,
    },
    seller: {
        name: "Seller Pinpin",
        action_name: "sell some stuff",
        value: 15,
        speed: 1.0,
    },
    farmer: {
        name: "Farmer Pinpin",
        action_name: "farm",
        value: 20,
        speed: 1.0,
    },
})

export class Pinpin {
    constructor(type, count) {
        this.type = type;
        this.count = count;
        this.total = count;
        this.interval_handle = null;
        this.speed = PinpinType.get(type, "speed");
        this.action = this.getActionForType(type);
        this.interval_handle = null;
    }

    setup() {
        this.interval_handle = setInterval(
            () => this.action(),
            this.speed * 1000.0
        );
    }

    reset() {
        clearInterval(this.interval_handle);
    }

    add(count) {
        this.count += count;
        this.total += count;
        if ((this.count - count) === 0) {
            this.setup();
        }
    }

    remove(count) {
        this.count -= count;
        if (this.count < 0) console.error(`${PinpinType.name(this.type)} count is < 0: ${this.count}`);
        if (this.count === 0) {
            this.reset();
        }
    }
    
    actionBase() {
        let pinpin_type = randomItem([
            PinpinType.explorer,
            PinpinType.seller,
            PinpinType.farmer,
        ]);

        game.log(`${this.count} ${PinpinType.name(this.type)} decided to ${PinpinType.get(pinpin_type, "action_name")}`)
        const action = this.getActionForType(pinpin_type);
        action();
    }
    
    actionExplorer() {
        actions.exploreForest(this.count);
    }

    actionSeller() {
        actions.trySell(1, this.count);
    }

    actionFarmer() {
        actions.farm(this.count);
    }

    getActionForType(type) {
        switch (type) {
            case PinpinType.explorer: return () => this.actionExplorer();
            case PinpinType.seller:   return () => this.actionSeller();
            case PinpinType.farmer:   return () => this.actionFarmer();
            default:                  return () => this.actionBase();
        }
    }
}

export class Village {
    constructor() {
        this.pinpins = {};
        this.max_pinpin_level = -1;

        for (const [id, _] of PinpinType.each()) {
            this.pinpins[id] = new Pinpin(id, 0);
        }
    }

    init() {
        
    }

    getSaveData() {
        let data = {};
        for (const [id, item] of Object.entries(this.pinpins)) {
            if (item.total > 0) {
                data[id] = {
                    count: item.count,
                    total: item.total,
                }
            }
        }
        return data;
    }

    loadSaveData(data) {
        for (const [id, item] of Object.entries(data)) {
            this.pinpins[id].total = item.total;
            this.add(id, item.count);
        }
    }

    add(type, count = 1) {
        if (type > this.max_pinpin_level) this.max_pinpin_level = type;
        this.pinpins[type].add(count);
        sendMsg(MessageTypes.pinpinUpdate, { type: type, count: this.pinpins[type].count });
    }

    remove(type, count = 1) {
        this.pinpins[type].remove(count);
        sendMsg(MessageTypes.pinpinUpdate, { type: type, count: this.pinpins[type].count });
    }

    totalOf(type) {
        return this.pinpins[type].total;
    }

    countOf(type) {
        return this.pinpins[type].count;
    }

    count() {
        let total = 0;
        for (const [_, item] of Object.entries(this.pinpins)) {
            total += item.count;
        }
        return total;
    }
}