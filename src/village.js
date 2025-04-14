import * as enums from "src/utils/enum.js"
import * as rand from "src/utils/rand.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js"

export const PinpinType = enums.make({
    base: {
        name: "Stupid Pinpin",
        desc: `
It's loyal, but not the smartest.
It'll try to do a random action to make you happy.
`,
        cooldown: 1,
    },
    explorer: {
        name: "Explorer Pinpin",
        desc: `
The Marco Polo of pinpins, it loves exploring
and will gather wood and seeds while it's out.
`,
        find: {
            [Resources.wood]: 1,
            [Resources.seeds]: 0.1,
        },
    },
    miner: {
        name: "Miner Pinpin",
        desc: `
Since it was a child, this pinpin has been 
yearning for the mine. It will gather stone.
`,
        find: {
            [Resources.stone]: 1,
        },
    },
    farmer: {
        name: "Farmer Pinpin",
        desc: `
It has a great green thumb, it will work in
your garden.
`,
        find: {},
    },
    seller: {
        name: "Seller Pinpin",
        action_name: "sell some stuff",
        find: {},
    },
})

export class Pinpin {
    constructor(type, count) {
        this.type = type;
        this.count = count;
        this.total = count;
        this.breeding = {
            chance: 0,
            time: 0,
        };
        this.aps = 1.0;
        this.action = this.getActionForType(type);

        this.cooldown = PinpinType.get(this.type, "cooldown", 0) * 1000;
        this.elapsed = this.cooldown;
    }

    add(count) {
        this.count += count;
        this.total += count;
    }

    rem(count) {
        this.count -= count;
    }

    logicTick(dt) {
        if (this.count <= 0) return;
        
        if (this.cooldown > 0) {
            this.elapsed += dt;
            while (this.elapsed >= this.cooldown) {
                this.elapsed -= this.cooldown;
                this.action(dt);
            }
        }
        else {
            this.action(dt);
        }
    }
        
    actionBase(dt) {
        let pinpin_type = rand.choose([
            PinpinType.explorer,
            // PinpinType.miner,
            // PinpinType.farmer,
        ]);

        const action = this.getActionForType(pinpin_type);
        action(1000);
    }

    actionSeller(dt) {
        // TODO
    }

    actionFarmer(dt) {
        let pin_count = this.count;
        for (const tile of game.garden.tiles) {
            let needed = tile.getPinpinNeeded();
            if (pin_count >= needed && tile.check()) {
                tile.start();
                pin_count -= needed;
                if (pin_count <= 0) {
                    return;
                }
            }
        }
    }

    actionFind(dt, type) {
        const apt = this.getActionPerTick(dt);
        const find = PinpinType.get(type, "find");
        for (const [id, count] of Object.entries(find)) {
            game.inventory.add(id, count * apt);
        }
    }

    getActionForType(type) {
        switch (type) {
            case PinpinType.explorer: return (dt) => this.actionFind(dt, PinpinType.explorer);
            case PinpinType.miner:    return (dt) => this.actionFind(dt, PinpinType.miner);
            case PinpinType.farmer:   return (dt) => this.actionFarmer(dt);
            case PinpinType.seller:   return (dt) => this.actionSeller(dt);
            default:                  return (dt) => this.actionBase(dt);
        }
    }

    getActionPerTick(dt) {
        return this.aps * dt * 0.001 * this.count;
    }
}

export class Village {
    constructor() {
        this.pinpins = [];

        for (const [id, _] of PinpinType.each()) {
            this.pinpins[id] = new Pinpin(id, 0);
        }
    }

    add(type, count = 1) {
        this.pinpins[type].add(count);
    }

    rem(type, count = 1) {
        this.pinpins[type].rem(count);
    }

    get(type) {
        return this.pinpins[type];
    }

    totalOf(type) {
        return this.pinpins[type].total;
    }

    countOf(type) {
        return this.pinpins[type].count;
    }

    count() {
        let total = 0;
        for (const pin of this.pinpins) {
            total += pin.count;
        }
        return total;
    }

    hasEnough(pins) {
        for (const [id, count] of Object.entries(pins)) {
            if (this.pinpins[id].count < count) {
                return false;
            }
        }
        return true;
    }

    addMultiple(pins) {
        for (const [id, count] of Object.entries(pins)) {
            this.add(id, count);
        }
    }

    removeMultiple(pins) {
        for (const [id, count] of Object.entries(pins)) {
            this.rem(id, count);
        }
    }

    logicTick(dt) {
        for (const pin of this.pinpins) {
            pin.logicTick(dt);
        }
    }
}