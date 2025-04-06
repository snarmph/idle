import { randomResources } from "src/utils/rand.js"
import { makeEnum } from "src/utils/enum.js"
import { Colours } from "src/log.js"
import { Resources } from "src/inventory.js"
import { ResourceCondition } from "src/condition.js"
import { game } from "src/game.js"
import { sendMsg, MessageTypes } from "src/messages.js"

export const HouseLevels = makeEnum({
    none: {
        name: "None",
        tiles: 0,
    },
    tent: {
        name: "Tent",
        tiles: 5,
        show: {
            [Resources.wood]: 20,
        },
        cost: {
            [Resources.wood]: 100,
        },
        time: 2.0,
    },
    house: {
        name: "House",
        tiles: 10,
        show: {
            [Resources.stone]: 20,
        },
        cost: {
            [Resources.wood]: 500,
            [Resources.stone]: 100,
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
        this.multiplier = 1;
        this.condition = null;
        this.listener_id = null;
    }

    check() {
        if (!this.condition) {
            return true;
        }
        let unlocked = this.condition.step();
        this.condition.reset();
        return unlocked;
    }

    next() {
        let found = null;

        const old_state = TileState.fromIndex(this.state);
        if ("cost" in old_state) {
            for (const [id, count] of Object.entries(old_state.cost)) {
                game.inventory.remove(id, count);
            }
        }

        this.state += 1;
        if (this.state >= TileState.count()) {
            this.state = 0;
            found = this.harvest();
        }

        const state = TileState.fromIndex(this.state);
        if ("cost" in state) {
            this.condition = new ResourceCondition(state.cost);
        }
        else {
            this.condition = null;
        }
        sendMsg(MessageTypes.gardenUpdate, { index: this.index, harvest: found });
    }

    harvest() {
        const found = randomResources({
            [Resources.wheat]: { min: 1, max: 4, atleast: 80 },
            [Resources.seeds]: { atleast: 90 },
        });
        const items = found.getResults();
        for (const red of items) {
            game.inventory.add(red.id, red.count * this.multiplier);
        }
        return items;
    }
}

export class Garden {
    constructor() {
        this.tiles = [];
        this.house = HouseLevels.none;
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

        sendMsg(MessageTypes.houseUpgrade, { level: this.house });
        return true;
    }
}