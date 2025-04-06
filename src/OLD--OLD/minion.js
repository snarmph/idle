import { makeObjectEnum, getRandomInt } from "src/utils.js"
import { game } from "src/game.js"
import { sendMessage, MessageTypes } from "src/messages.js"
import * as actions from "src/actions.js"

export const MinionType = makeEnum({
    base: {
        name: "Pinpin",
        value: 10,
        speed: 5.0,
    },
    explorer: {
        name: "Explorer Pinpin",
        value: 50,
        speed: 1.0,
    },
    seller: {
        name: "Seller Pinpin",
        value: 100,
        speed: 1.0,
    },
    farmer: {
        name: "Farmer Pinpin",
        value: 300,
        speed: 1.0,
    },
})

export class Minion {
    constructor(type, count) {
        this.type = type;
        this.count = count;
        this.interval_handle = null;
        this.speed = MinionType.get(type, "speed");

        this.action = this.getActionForType(type);

        this.interval_handle = setInterval(
            () => {
                for (let i = 0; i < this.count; ++i) {
                    this.action(i);
                }
            },
            this.speed * 1000.0
        );
    }

    add(count) {
        this.count += count;
        this.action();
    }

    actionBase(index) {
        const minion_type = getRandomInt(1, game.village.max_minion_level + 1);
        if (minion_type <= 0) return;
        const action = this.getActionForType(minion_type);
        action();
    }

    actionExplorer(index) {
        actions.exploreForest();
    }

    actionSeller(index) {
        actions.trySell();
    }

    actionFarmer(index) {
        actions.farm();
    }

    getActionForType(type) {
        switch (type) {
            case MinionType.explorer: return this.actionExplorer;
            case MinionType.seller:   return this.actionSeller;
            case MinionType.farmer:   return this.actionFarmer;
            default:                  return this.actionBase;
        }
    }
}

export class Village {
    constructor() {
        this.minions = {};
        this.max_minion_level = -1;

        for (const [id, _] of MinionType.each()) {
            this.minions[id] = new Minion(id, 0);
        }
    }

    add(type, count = 1) {
        console.log(">", MinionType.name(type), type);
        if (type > this.max_minion_level) this.max_minion_level = type;
        this.minions[type].add(count);
        sendMessage(MessageTypes.minionUpdate);
    }

    countOf(type) {
        return this.minions[type].count;
    }

    count() {
        for (const [_, item] of Object.entries(this.minions)) {
            return item.count;
        }
    }
}
