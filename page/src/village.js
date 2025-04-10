import * as enums from "src/utils/enum.js"
import * as rand from "src/utils/rand.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js"

export const PinpinType = enums.make({
    base: {
        name: "Stupid Pinpin",
        action_name: "",
        value: 5,
        cooldown: 1,
    },
    explorer: {
        name: "Explorer Pinpin",
        action_name: "explore the wilderness",
        value: 10,
    },
    miner: {
        name: "Miner Pinpin",
        action_name: "mine",
        value: 15,
    },
    farmer: {
        name: "Farmer Pinpin",
        action_name: "farm",
        value: 20,
        cooldown: 2,
    },
    seller: {
        name: "Seller Pinpin",
        action_name: "sell some stuff",
        value: 25,
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

    tick(dt) {
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
            PinpinType.miner,
            PinpinType.farmer,
        ]);

        const action = this.getActionForType(pinpin_type);
        action(1000);
    }
    
    actionExplorer(dt) {
        const res = {
            [Resources.wood]: this.aps * dt * 0.001,
            [Resources.seeds]: (this.aps * 0.01) * dt * 0.001,
        }
        game.inventory.addMultiple(res);
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

    actionMiner(dt) {
        const stone_ps = 1.0 * this.aps * 0.001;
        const stone = stone_ps * dt;
        console.log(stone);
        game.inventory.add(Resources.stone, stone);
    }

    getActionForType(type) {
        switch (type) {
            case PinpinType.explorer: return (dt) => this.actionExplorer(dt);
            case PinpinType.miner:    return (dt) => this.actionMiner(dt);
            case PinpinType.farmer:   return (dt) => this.actionFarmer(dt);
            case PinpinType.seller:   return (dt) => this.actionSeller(dt);
            default:                  return (dt) => this.actionBase(dt);
        }
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

    tick(dt) {
        for (const pin of this.pinpins) {
            pin.tick(dt);
        }
    }
}