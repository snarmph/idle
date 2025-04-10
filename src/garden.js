import * as enums from "src/utils/enum.js"
import * as rand from "src/utils/rand.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js";
import { Colours } from "src/log.js";

export const HouseLevels = enums.make({
    none: {
        name: "None",
        tiles: 0,
    },
    tent: {
        name: "Tent",
        tiles: 5,
        show: {
            [Resources.wood]: 5,
        },
        cost: {
            [Resources.wood]: 20,
        },
        time: 2.0,
    },
    house: {
        name: "House",
        tiles: 10,
        show: {
            [Resources.stone]: 5,
        },
        cost: {
            [Resources.wood]: 50,
            [Resources.stone]: 20,
        },
        time: 4.0,
    },
    castle: {
        name: "Castle",
        tiles: 25,
        show: {
            [Resources.wood]: 1000,
            [Resources.stone]: 500,
        },
        cost: {
            [Resources.wood]: 10000,
            [Resources.stone]: 5000,
        },
        time: 4.0,
    },
})

export const TileState = enums.make({
    dirt: {
        name: "Prepare",
        time: 10,
    },
    cleaned: {
        name: "Plant",
        icon: {
           text: "𖧧",
           colour: Colours.green,
        },
        cost: {
            [Resources.seeds]: 1,
        },
        time: 10,
    },
    growing: {
        name: "Growing",
        autorun: true,
        time: 20,
    },
    ready: {
        name: "Harvest",
        icon: {
           text: "𓌜",
           colour: Colours.yellow,
        },
        time: 5,
    }
});

export class GardenTile {
    constructor(index) {
        this.index = index;
        this.state = TileState.dirt;
        this.resource = Resources.wheat;
        this.num_multiplier = 1;
        this.speed_multiplier = 1;
        this.replant_chance = 0;
        
        this.current_time = 0;
        this.total_time = 0;
        this.is_running = false;
    }

    check() {
        if (this.is_running) return false;
        return game.inventory.hasEnough(TileState.get(this.state, "cost"));
    }

    start() {
        const state = TileState.fromIndex(this.state);
        this.total_time = state.time * 100
        this.is_running = true;
        this.current_time = 0;
        
        game.inventory.removeMultiple(state.cost);
    }

    finish() {
        this.is_running = false;
        this.state += 1;
        if (this.state >= TileState.count()) {
            this.state = 0;
            this.harvest();
        }
        if (TileState.get(this.state, "autorun", false)) {
            this.start();
        }
    }

    tick(dt) {
        if (!this.is_running) {
            return;
        }

        this.current_time += dt;
        if (this.current_time >= this.total_time) {
            this.finish();
        }
    }

    getAlpha() {
        return this.is_running ? this.current_time / this.total_time : 1;
    }

    harvest() {
        const resources = {
            [Resources.wheat]: 1 * this.num_multiplier,
            [Resources.seeds]: 0.1 * this.num_multiplier,
        };
        game.inventory.addMultiple(resources);
    }

    getPinpinNeeded() {
        return this.num_multiplier;
    }
}

export class Garden {
    constructor() {
        this.tiles = [];
        this.level = HouseLevels.none;
    }

    upgrade(remove_resources = true) {
        if (this.level + 1 >= HouseLevels.count()) {
            console.error("trying to upgrade house over max level");
            return;
        }
        
        const old_len = HouseLevels.get(this.level, "tiles");
        this.level += 1;
        const len = HouseLevels.get(this.level, "tiles");
        
        for (let i = old_len; i < len; ++i) {
            this.tiles.push(new GardenTile(i));
        }
    }

    tick(dt) {
        for (const tile of this.tiles) {
            tile.tick(dt);
        }
    }
}