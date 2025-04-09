import { randomResources } from "src/utils/rand.js"
import { makeEnum } from "src/utils/enum.js"
import { Colours } from "src/log.js"
import { Resources } from "src/inventory.js"
import { ResourceCondition } from "src/condition.js"
import { game } from "src/game.js"
import { sendMsg, MessageTypes } from "src/messages.js"
import { Timer } from "src/utils/timer.js"
import { SkillCondition } from "./condition.js"

export const HouseLevels = makeEnum({
    none: {
        name: "None",
        tiles: 0,
    },
    tent: {
        name: "Tent",
        tiles: 5,
        show: {
            [Resources.wood]: 10,
        },
        cost: {
            [Resources.wood]: 50,
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
            [Resources.wood]: 100,
            [Resources.stone]: 20,
        },
        time: 4.0,
    },
    castle: {
        name: "Castle",
        tiles: 25,
        show: {
            [Resources.wood]: 10000,
            [Resources.stone]: 5000,
            [Resources.money]: 1000,
        },
        cost: {
            [Resources.wood]: 100000,
            [Resources.stone]: 50000,
            [Resources.money]: 100000,
        },
        time: 4.0,
    },
})

export const TileState = makeEnum({
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
        this.condition = null;
        this.listener_id = null;
        this.timer = null;

        this.on_start_cooldown = null;
        this.on_step_cooldown = null;
        this.on_end_cooldown = null;
    }
    
    runState(found = null) {
        const state = TileState.fromIndex(this.state);
        if ("cost" in state) {
            const cost = {};
            for (let [id, count] of Object.entries(state.cost)) {
                cost[id] = count * this.num_multiplier;
            }
            this.condition = new ResourceCondition(cost);
        }
        else {
            this.condition = null;
        }

        sendMsg(MessageTypes.gardenUpdate, { index: this.index, harvest: found });

        if ("autorun" in state && state.autorun) {
            this.tryNext();
        }
    }

    startTimer(from = 0) {
        const state = TileState.fromIndex(this.state);

        this.timer = new Timer(
            state.time * 1000.0 * this.speed_multiplier, 
            this.on_step_cooldown,
            () => {
                this.timer = null;
                this.next();
                if (this.on_end_cooldown) {
                    this.on_end_cooldown();
                }
            }
        )
        this.timer.start(from);
    }

    check() {
        if (this.timer && this.timer.is_running) return false;
        if (!this.condition) return true;
        let unlocked = this.condition.step();
        this.condition.reset();
        return unlocked;
    }

    getPinpinNeeded() {
        return this.num_multiplier;
    }

    tryNext() {
        if (!this.check()) return false;

        const state = TileState.fromIndex(this.state);

        if ("cost" in state) {
            for (const [id, count] of Object.entries(state.cost)) {
                game.inventory.remove(id, count * this.num_multiplier);
            }
        }

        this.startTimer();
        if (this.on_start_cooldown) {
            this.on_start_cooldown();
        }
        
        return true;
    }

    next() {
        let found = null;

        this.state += 1;
        if (this.state >= TileState.count()) {
            this.state = 0;
            found = this.harvest();
        }

        this.runState(found);
    }

    harvest() {
        const found = randomResources({
            [Resources.wheat]: { min: 1, max: 4, atleast: 80 },
            [Resources.seeds]: { atleast: 90 },
        });
        const items = found.getResults();
        for (const index in items) {
            items[index].count *= this.num_multiplier;
            game.inventory.add(items[index].id, items[index].count);
        }
        return items;
    }
}

export class Garden {
    constructor() {
        this.tiles = [];
        this.house = HouseLevels.none;
    }

    init() {
        this.setupConditions();
    }

    getSaveData() {
        let data = {
            level: this.house,
            tiles: {},
        };
        for (const tile of this.tiles) {
            if (tile.state !== TileState.dirt || (tile.timer && tile.timer.is_running)) {
                data.tiles[tile.index] = {
                    state: tile.state,
                    resource: tile.resource,
                    num_multiplier: tile.num_multiplier,
                    speed_multiplier: tile.speed_multiplier,
                    timer: tile.timer && tile.timer.is_running ? tile.timer.cur_time : 0,
                }
            }
        }
        return data;
    }

    loadSaveData(data) {
        // TODO: this gives weird result when reloading from an
        // already loaded state??
        this.tiles = [];
        this.house = HouseLevels.none;

        for (let i = 0; i < data.level; ++i) {
            this.upgrade();
        }

        for (const [index, item] of Object.entries(data.tiles)) {
            const tile = this.tiles[index];
            tile.state = item.state;
            tile.resource = item.resource;
            tile.num_multiplier = item.num_multiplier;
            tile.speed_multiplier = item.speed_multiplier;
            if (item.timer > 0) {
                tile.startTimer(item.timer);
            }
            tile.runState();
        }

    }

    upgrade() {
        if (this.house + 1 >= HouseLevels.count()) {
            return false;
        }

        const old_len = HouseLevels.get(this.house, "tiles");
        this.house += 1;
        const len = HouseLevels.get(this.house, "tiles");

        for (let i = old_len; i < len; ++i) {
            this.tiles.push(new GardenTile(i));
        }

        if (!game.is_loading) {
            const cost = HouseLevels.fromIndex(this.house).cost;
            for (const [id, count] of Object.entries(cost)) {
                game.inventory.remove(id, count);
            }
        }

        sendMsg(MessageTypes.houseUpgrade, { level: this.house });
        return true;
    }

    setupConditions() {
        new SkillCondition(
            "garden_tiles",
            (skill) => {
                for (const tile of this.tiles) {
                    tile.num_multiplier = 25;
                }
            }
        );
        new SkillCondition(
            "fast_crops",
            (skill) => {
                let spd_mul = 1.0;
                switch (skill.upgrade) {
                    case 0:
                        spd_mul = 0.95;
                        break;
                    case 1:
                        spd_mul = 0.90;
                        break;
                    case 2:
                        spd_mul = 0.75;
                        break;
                    case 3:
                        spd_mul = 0.50;
                        break;
                    case 4:
                        spd_mul = 0.25;
                        break;
                }
                console.log("speed: ", this.tiles[0].speed_multiplier * spd_mul);
                for (const tile of this.tiles) {
                    tile.speed_multiplier *= spd_mul;
                }
            }
        )
    }
}