import { makeEnum, makeNamedEnum, makeObjectEnum } from "./utils.js";

export const MessageTypes = makeEnum([
    "inventoryUpdate",
    "resourceUpdate", 
    "itemUpdate", 
]);

export const Resources = makeObjectEnum({
    wood: {
        name: "wood",
    },
    stone: {
        name: "stone",
    }
})

export const Items = makeObjectEnum({
    axe: {
        name: "Axe",
        numerable: false,
        upgrades: [
            {
                name: "Wood Axe",
                show: {
                    [Resources.wood]: 5,
                },
                cost: {
                    [Resources.wood]: 20,
                },
                time: 2,
            },
            {
                name: "Stone Axe",
                show: {
                    [Resources.stone]: 5,
                },
                cost: {
                    [Resources.wood]: 10,
                    [Resources.stone]: 20,
                },
                time: 4,
            }
        ],
    },
    pick: {
        name: "Pick",
        numerable: false,
        upgrades: [
            {
                name: "Wood Pick",
                show: {
                    [Resources.wood]: 5,
                },
                cost: {
                    [Resources.wood]: 20,
                },
                time: 2,
            },
            {
                name: "Stone Pick",
                show: {
                    [Resources.stone]: 5,
                },
                cost: {
                    [Resources.wood]: 10,
                    [Resources.stone]: 20,
                },
                time: 4,
            }
        ],
    },
    house: {
        name: "House",
        numerable: false,
        upgrades: [
            {
                name: "Wood House",
                show: {
                    [Resources.wood]: 20,
                },
                cost: {
                    [Resources.wood]: 200,
                },
                time: 20,
            }
        ]
    },
});

class Action {
    constructor(resource, count, timer) {
        this.resource = resource;
        this.count = count;
        this.timer = timer;
    }
}

export const Npcs = makeObjectEnum({
    villager: {
        name: "Villager",
        actions: [ 
           new Action(Resources.wood, 1, 1),
        ],
    },
    stone_miner: {
        name: "Stone Miner",
        actions: [ 
            new Action(Resources.stone, 1, 1),
        ],
    },
});