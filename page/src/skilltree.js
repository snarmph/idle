import * as enums from "src/utils/enum.js"
import { PinpinType } from "src/village.js";
import { Resources } from "src/inventory.js"
import { Colours } from "src/log.js"
import { game } from "src/game.js"

export const SkillsData = Object.freeze({
    base: {
        name: "You",
        icon: "@",
        x: 2, y: 4,
        children: {
            forest: {
                name: "Forest Skills",
                desc: "Unlock forest-related skills",
                icon: "f",
                x: 2, y: 2,
                cost: {
                    resources: {
                        [Resources.wood]:  500,
                        [Resources.stone]:  25,
                        [Resources.wheat]:  30,
                    },
                    pinpins: {
                        [PinpinType.base]: 3,
                    },
                },
                children: {
                    merchant_pp_sell: {
                        name: "Exotic Merchant",
                        desc: `Merchant can now sell ${PinpinType.name(PinpinType.explorer)}`,
                        icon: "m",
                        x: 0, y: 2,
                        cost: {
                            resources: {
                                [Resources.wood]:  100,
                                [Resources.stone]:  10,
                                [Resources.seeds]:  20,
                            },
                        },
                        upgrades: [
                            {
                                desc: `Merchant can now sell ${PinpinType.name(PinpinType.miner)}`,
                                cost: {
                                    resources: {
                                        [Resources.stone]: 50,
                                    },
                                },
                            },
                            {
                                desc: `Merchant can now sell ${PinpinType.name(PinpinType.farmer)}`,
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 50,
                                    },
                                },
                            },
                            // {
                            //     desc: `Merchant can now sell ${PinpinType.name(PinpinType.seller)}`,
                            //     cost: {
                            //         resources: {
                            //             [Resources.money]: 30,
                            //         },
                            //     },
                            // },
                        ]
                    },
                    merchant_crops: {
                        name: "Rich Merchant",
                        desc: "The Merchant now buys 10x crops at a time and gives 2x the items when bartering",
                        icon: "c",
                        x: 2, y: 0,
                        cost: {
                            resources: {
                                [Resources.wheat]: 100,
                            },
                        },
                        upgrades: [
                            {
                                desc: "The Merchant now buys 50x crops at a time and gives 5x the items when bartering",
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 1000,
                                    },
                                },
                            },
                            {
                                desc: "The Merchant now buys 1000x crops at a time and gives 200x the items when bartering",
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 1_000_000,
                                    },
                                },
                            },
                        ],
                        children: {
                            merchant_gen: {
                                name: "Generous Merchant",
                                desc: "The Merchant now buys crops at +5% per crop",
                                icon: "g",
                                x: 0, y: 0,
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 1000,
                                    },
                                },
                                upgrades: [
                                    {
                                        desc: "The Merchant now buys crops at +10% per crop",
                                        cost: {
                                            resources: {
                                                [Resources.wheat]: 5000,
                                            },
                                        },
                                    },
                                    {
                                        desc: "The Merchant now buys crops at +30% per crop",
                                        cost: {
                                            resources: {
                                                [Resources.wheat]: 150_000,
                                            },
                                        },
                                    },
                                    {
                                        desc: "The Merchant now buys crops at +50% per crop",
                                        cost: {
                                            resources: {
                                                [Resources.wheat]: 10_000_000,
                                            },
                                        },
                                    },
                                ]
                            }
                        }
                    }
                }
            },
            castle: {
                name: "Castle Skills",
                desc: "Unlock castle-related skills",
                icon: "c",
                x: 4, y: 4,
                cost: {
                    resources: {
                        [Resources.wood]:   10_000,
                        [Resources.stone]: 100_000,
                    }
                },
                children: {
                    garden_tiles: {
                        name: "The Great Garden",
                        desc: "Every garden tile is now equivalent to 25x garden tiles, you'll need 25x the seeds and 25x the pinpins too",
                        icon: "t",
                        x: 4, y: 2,
                        cost: {
                            resources: {
                                [Resources.wheat]: 100_000, 
                            },
                            pinpins: {
                                [PinpinType.farmer]: 25,
                            },
                        }
                    },
                    fast_crops: {
                        name: "Fertilizer",
                        desc: "Crops grow +5% faster",
                        icon: "g",
                        x: 4, y: 6,
                        cost: {
                            resources: {
                                [Resources.wheat]: 1000,
                            },
                        },
                        upgrades: [
                            {
                                desc: "Crops grow +10% faster",
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 100_000,
                                    },
                                },
                            },
                            {
                                desc: "Crops grow +25% faster",
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 1_000_000,
                                    },
                                },
                            },
                            {
                                desc: "Crops grow +50% faster",
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 100_000_000,
                                    },
                                },
                            },
                            {
                                desc: "Crops grow +75% faster",
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 10_000_000_000,
                                    },
                                },
                            }
                        ],
                        children: {
                            seed_chance: {
                                name: "Lucky Seed",
                                desc: "Crops have a +5% chance of leaving seeds planted",
                                icon: "f",
                                x: 6, y: 6,
                                cost: {
                                    resources: {
                                        [Resources.seeds]: 100,
                                        [Resources.wheat]: 1000,
                                    }
                                },
                                upgrades: [
                                    {
                                        desc: "Crops have a +15% chance of leaving seeds planted",
                                        cost: {
                                            resources: {
                                                [Resources.seeds]: 1000,
                                                [Resources.wheat]: 10_000,
                                            }
                                        },
                                    },
                                    {
                                        desc: "Crops have a +50% chance of leaving seeds planted",
                                        cost: {
                                            resources: {
                                                [Resources.seeds]: 100_000,
                                                [Resources.wheat]: 1_000_000,
                                            }
                                        },
                                    },
                                    {
                                        desc: "Crops have a +75% chance of leaving seeds planted",
                                        cost: {
                                            resources: {
                                                [Resources.seeds]: 1_000_000,
                                                [Resources.wheat]: 100_000_000,
                                            }
                                        },
                                    },
                                ]
                            }
                        }
                    }
                }
            },
            pinpin: {
                name: "Pinpin Skills",
                desc: "Make your pinpins special",
                icon: "p",
                x: 2, y: 6,
                cost: {
                    pinpins: {
                        [PinpinType.base]: 10,
                    },
                },
                children: {
                    pinpin_breeding: {
                        name: "Get a room",
                        desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 0.1% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every 5 seconds`,
                        icon: "b",
                        x: 0, y: 6,
                        cost: {
                            pinpins: {
                                [PinpinType.base]: 10,
                            },
                        },
                        upgrades: [
                            {
                                desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 1% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every 3 seconds`,
                                cost:{
                                    pinpins: {
                                        [PinpinType.base]: 25,
                                    },
                                },
                            },
                            {
                                desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 2% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every second`,
                                cost:{
                                    pinpins: {
                                        [PinpinType.base]: 70,
                                    },
                                },
                            },
                            {
                                desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 5% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every 0.5 seconds`,
                                cost:{
                                    pinpins: {
                                        [PinpinType.base]: 1000,
                                    },
                                },
                            },
                        ],
                        children: {
                            special_breed: {
                                name: "Like father like son",
                                desc: "Any pair of specialised pinpins have a 5% chance of breeding every 10 seconds",
                                icon: "s",
                                x: 0, y: 8,
                                cost: {
                                    pinpins: {
                                        [PinpinType.explorer]: 1,
                                        [PinpinType.farmer]:   1,
                                        [PinpinType.miner]:    1,
                                    },
                                },
                                upgrades: [
                                    {
                                        desc: "Any pair of specialised pinpins have a 15% chance of breeding every 5 seconds",
                                        cost: {
                                            pinpins: {
                                                [PinpinType.explorer]: 5,
                                                [PinpinType.farmer]:   5,
                                                [PinpinType.miner]:    5,
                                            },
                                        },
                                    },
                                    {
                                        desc: "Any pair of specialised pinpins have a 30% chance of breeding every 2.5 seconds",
                                        cost: {
                                            pinpins: {
                                                [PinpinType.explorer]: 25,
                                                [PinpinType.farmer]:   25,
                                                [PinpinType.miner]:    25,
                                            },
                                        },
                                    },
                                    {
                                        desc: "Any pair of specialised pinpins have a 50% chance of breeding every second",
                                        cost: {
                                            pinpins: {
                                                [PinpinType.explorer]: 200,
                                                [PinpinType.farmer]:   200,
                                                [PinpinType.miner]:    200,
                                            },
                                        },
                                    },
                                    {
                                        desc: "Any pair of specialised pinpins have a 75% chance of breeding every 0.5 seconds",
                                        cost: {
                                            pinpins: {
                                                [PinpinType.explorer]: 20_000,
                                                [PinpinType.farmer]:   20_000,
                                                [PinpinType.miner]:    20_000,
                                            },
                                        },
                                    },
                                ],
                            }
                        }
                    },
                }
            }
        },
    },
});

export class Skill {
    constructor(id, skill, parent) {
        this.id = id;
        this.parent = parent;
        this.children = [];
        this.data = skill;
        this.upgrade = -1;
        this.unlocked = false;
        this.finished_upgrading = false;

        if (parent) {
            parent.children.push(this);
        }

        this.name = skill.name;
        this.desc = skill.desc;
        this.cost = {
            resources: {},
            pinpins: {},
        };
        if (skill.cost) {
            if ("resources" in skill.cost) {
                this.cost.resources = skill.cost.resources;
            }
            if ("pinpins" in skill.cost) {
                this.cost.pinpins = skill.cost.pinpins;
            }
        }
    }

    check() {
        if (this.finished_upgrading) {
            return false;
        }

        if (!game.inventory.hasEnough(this.cost.resources)) {
            return false;
        }
        
        if (!game.village.hasEnough(this.cost.pinpins)) {
            return false;
        }
        
        return true;
    }

    unlock() {
        game.inventory.removeMultiple(this.cost.resources);
        game.village.removeMultiple(this.cost.pinpins);

        this.unlocked = true;
        this.upgrade += 1;

        let finished = true;
        if (this.data.upgrades && this.data.upgrades.length > this.upgrade) {
            finished = false;
            const upgrade = this.data.upgrades[this.upgrade];
            if ("name" in upgrade) this.name = upgrade.name;
            if ("desc" in upgrade) this.desc = upgrade.desc;
            if ("cost" in upgrade) {
                this.cost.resources = "resources" in upgrade.cost 
                    ? upgrade.cost.resources 
                    : {};
                    
                this.cost.pinpins = "pinpins" in upgrade.cost 
                    ? upgrade.cost.pinpins 
                    : {};
            }
        }

        this.finished_upgrading = finished;
    }
}

export class SkillTree {
    constructor() {
        this.width = 7;
        this.height = 9;
        this.skills = {};

        this.addSkill(SkillsData.base, "base", null);
        this.skills["base"].unlock();
    }

    get(id) {
        return this.skills[id];
    }

    addSkill(skill, key, parent) {
        const new_skill = new Skill(key, skill, parent);
        this.skills[key] = new_skill

        if ("children" in skill) {
            for (const [id, child] of Object.entries(skill.children)) {
                this.addSkill(child, id, new_skill);
            }
        }
    }

    isUnlocked(id) {
        return this.skills[id].unlocked;
    }

    isUpgrade(id, upgrade) {
        return this.skills[id].upgrade >= upgrade;
    }
}