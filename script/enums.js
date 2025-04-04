import { makeEnum, makeObjectEnum } from "script/utils.js";

export const MessageTypes = makeEnum([
    "eventUpdate", 
    "resourceUpdate", 
    "itemUpdate", 
    "minionUpdate",
]);

export const Colours = makeObjectEnum({
    default: "main-col",
    green: "green-col",
    yellow: "yellow-col",
    red: "red-col",
});

export const Resources = makeObjectEnum({
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
    },
    money: {
        name: "coins",
        singular: "coin",
    },
})

export const Items = makeObjectEnum({
    house: {
        name: "House",
        numerable: false,
        visible: false,
        upgrades: [
            {
                name: "Tent",
                show: {
                    [Resources.wood]: 20,
                },
                cost: {
                    [Resources.wood]: 100,
                },
                time: 2.0,
            },
            {
                name: "House",
                show: {
                    [Resources.stone]: 20,
                },
                cost: {
                    [Resources.wood]: 500,
                    [Resources.stone]: 100,
                },
                time: 4.0,
            },
            {
                name: "Castle",
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
            }
        ]
    },
    
    hoe: {
        name: "Hoe",
        numerable: false,
        upgrades: [
            {
                name: "Wood Hoe",
                show: {
                    [Resources.wood]:  5,
                    [Resources.seeds]: 5,
                },
                cost: {
                    [Resources.wood]: 20,
                },
                time: 0.2,
            },
            {
                name: "Stone Hoe",
                show: {
                    [Resources.stone]: 5,
                },
                cost: {
                    [Resources.wood]: 50,
                    [Resources.stone]: 20,
                },
                time: 0.4,
            }
        ]
    },
    trowel: {
        name: "Trowel",
        numerable: false,
        upgrades: [
            {
                name: "Wood Trowel",
                show: {
                    [Resources.wood]: 20,
                    [Resources.seeds]: 20,
                    [Resources.wheat]: 10,
                },
                cost: {
                    [Resources.wood]: 50,
                },
                time: 0.2,
            },
            {
                name: "Stone Trowel",
                show: {
                    [Resources.stone]: 10,
                    [Resources.wheat]: 50,
                },
                cost: {
                    [Resources.wood]: 50,
                    [Resources.stone]: 20,
                },
                time: 0.4,
            }
        ]
    },
    scythe: {
        name: "Scythe",
        numerable: false,
        upgrades: [
            {
                name: "Wood Scythe",
                show: {
                    [Resources.wood]: 20,
                    [Resources.seeds]: 20,
                    [Resources.wheat]: 10,
                },
                cost: {
                    [Resources.wood]: 50,
                },
                time: 0.2,
            },
            {
                name: "Stone Scythe",
                show: {
                    [Resources.stone]: 10,
                    [Resources.wheat]: 50,
                },
                cost: {
                    [Resources.wood]: 50,
                    [Resources.stone]: 20,
                },
                time: 0.4,
            }
        ]
    },
    axe: {
        name: "Axe",
        numerable: false,
        upgrades: [
            {
                name: "Wood Axe",
                show: {
                    [Resources.wheat]: 20,
                },
                cost: {
                    [Resources.wood]: 50,
                },
                time: 0.2,
            },
            {
                name: "Stone Axe",
                show: {
                    [Resources.stone]: 10,
                    [Resources.wheat]: 50,
                },
                cost: {
                    [Resources.wood]: 50,
                    [Resources.stone]: 20,
                },
                time: 0.4,
            }
        ]
    }

/*
    hoe: {
        name: "Hoe",
        numerable: false,
        upgrades: [
            {
                name: "Wood Hoe",
                show: {
                    [Resources.wood]: 5,
                },
                cost: {
                    [Resources.wood]: 20,
                },
                time: 0.2,
            },
            {
                name: "Seed Hoe",
                show: {
                    [Resources.seeds]: 1,
                },
                cost: {
                    [Resources.wood]: 50,
                },
                time: 0.4,
            }
        ]
    }
*/
/*
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
*/
});

/*
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
*/