import { makeObjectEnum, getRandomInt, randomCheckPercent } from "script/utils.js"
import { Items, Resources } from "script/enums.js"
import { ResourceCondition } from "script/condition.js"

export const TileState = makeObjectEnum({
    dirt: {
        name: "Prepare",
        message: "prepared",
        default_time: 10,
        time: {
            [Items.hoe]: [
                5, 1,
            ],
        },
    },
    cleaned: {
        name: "Plant",
        message: "planted",
        cost: {
            [Resources.seeds]: 1,
        },
        default_time: 10,
        time: {
            [Items.trowel]: [
                5, 1,
            ]
        },
    },
    growing: {
        name: "Growing",
        default_time: 20,
    },
    ready: {
        name: "Harvest",
        default_time: 5,
        time: {
            [Items.scythe]: [
                2.5, 0.5,
            ]
        },
    }
});

export class GardenTile {
    constructor() {
        this.state = TileState.dirt;
        this.resource = Resources.wheat;
        this.condition = null;
        this.listener_id = null;
    }

    nextState() {
        let reset = false;
        this.state += 1;
        if (this.state >= TileState.count()) {
            this.state = 0;
            reset = true;
        }

        const state = TileState.fromIndex(this.state);
        if ("cost" in state) {
            this.condition = new ResourceCondition(state.cost);
        }
        else {
            this.condition = null;
        }

        return reset;
    }

    step() {
        if (!this.condition) {
            return true;
        }
        let unlocked = this.condition.step();
        this.condition.reset();
        return unlocked;
    }

    harvest() {
        let count = 1;
        if (randomCheckPercent(80)) {
            count = getRandomInt(2, 4);
        }
        return {
            resource: this.resource,
            count: count,
        };
    }
}

export class Garden {

}