import { makeEnum } from "src/utils/enum.js"
import { PinpinType } from "src/village.js";
import { Resources } from "src/inventory.js"
import { Colours } from "src/log.js"
import { game } from "src/game.js"

/*
forest:
  - merchant can sell X pinpins
  - merchant buys X crops at a time
    - merchant gives +X% coins per wheat

castle:
  - every tile is made of X tiles
  - crops grow +X% faster
   - crops have a +X% change of leaving seeds planted
  
pinpins:
  - build pinpin X (hut, house, village) (fit 3, 10, 100 pinpins)
    - breed 2 base pinpins
      - breed 2 specialised pinpins
        - when breeding 2 specialised pinpins, they get +X% efficency
  - farmer pinpins can plant X
      0  1  2  3  4  5  6
    __^__^__^__^__^__^__^__
0 || [g]───[c]             || 
1 ||        │              || 
2 || [m]───[f]   [t]       || 
3 ||        │     │        || 
4 ||       [@]───[c]       || 
5 ||        │     │        || 
6 || [h]───[p]   [g]───[f] || 
7 ||  │                    || 
8 || [b]───[s]───[g]       || 


<span class="skill-item-container">
    <span id="${skill-id}" class="skill-item">
        [
        <span class="skill-icon" style="color: red">g</span>
        ]
    </span>
</span>

[g]───[c]              
       │               
[m]───[f]   [t]        
       │     │         
      [@]───[c]        
       │     │         
[h]───[p]   [g]───[f]  
 │                     
[b]───[s]───[g]         

*/

export const SkillsData = Object.freeze({
    base: {
        name: "You",
        icon: "@",
        icon_colour: Colours.default,
        x: 2, y: 4,
        children: {
            forest: {
                name: "Forest Skills",
                desc: "Unlock forest-related skills",
                icon: "f",
                icon_colour: Colours.green,
                x: 2, y: 2,
                cost: {
                    resources: {
                        [Resources.wood]:  500,
                        [Resources.stone]:  25,
                        [Resources.wheat]:  30,
                        [Resources.money]:  15,
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
                        icon_colour: Colours.red,
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
                                desc: `Merchant can now sell ${PinpinType.name(PinpinType.seller)}`,
                                cost: {
                                    resources: {
                                        [Resources.money]: 30,
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
                            }
                        ]
                    },
                    merchant_crops: {
                        name: "Rich Merchant",
                        desc: "The Merchant now buys 10x crops at a time",
                        icon: "c",
                        icon_colour: Colours.yellow,
                        x: 2, y: 0,
                        cost: {
                            resources: {
                                [Resources.wheat]: 100,
                            },
                        },
                        upgrades: [
                            {
                                desc: "The Merchant now buys 50x crops at a time",
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 1000,
                                    },
                                },
                            },
                            {
                                desc: "The Merchant now buys 1000x crops at a time",
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
                                icon_colour: Colours.yellow,
                                x: 0, y: 0,
                                cost: {
                                    resources: {
                                        [Resources.wheat]: 1000,
                                        [Resources.money]: 1000,
                                    },
                                },
                                upgrades: [
                                    {
                                        desc: "The Merchant now buys crops at +10% per crop",
                                        cost: {
                                            resources: {
                                                [Resources.wheat]: 5000,
                                                [Resources.money]: 5000,
                                            },
                                        },
                                    },
                                    {
                                        desc: "The Merchant now buys crops at +30% per crop",
                                        cost: {
                                            resources: {
                                                [Resources.wheat]: 150_000,
                                                [Resources.money]: 150_000,
                                            },
                                        },
                                    },
                                    {
                                        desc: "The Merchant now buys crops at +50% per crop",
                                        cost: {
                                            resources: {
                                                [Resources.wheat]: 10_000_000,
                                                [Resources.money]: 10_000_000,
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
                icon_colour: Colours.blue,
                x: 4, y: 4,
                cost: {
                    resources: {
                        [Resources.wood]:   10_000,
                        [Resources.stone]: 100_000,
                        [Resources.money]: 100_000,
                    }
                },
                children: {
                    tiles: {
                        name: "The Great Garden",
                        desc: "Every garden tile is now equivalent to 25x garden tiles, you'll need 25x the seeds and 25x the pinpins too",
                        icon: "t",
                        icon_colour: Colours.green,
                        x: 4, y: 2,
                        cost: {
                            resources: {
                                [Resources.wheat]: 100_000, 
                                [Resources.money]: 1_000_000, 
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
                        icon_colour: Colours.yellow,
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
                                icon_colour: Colours.green,
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
                icon_colour: Colours.purple,
                x: 2, y: 6,
                cost: {
                    pinpins: {
                        [PinpinType.base]: 10,
                    },
                },
                children: {
                    pinpin_house: {
                        name: "Pinpin Hut",
                        desc: "Build a hut for pinpins, every hut can store x3 pinpins",
                        icon: "h",
                        icon_colour: Colours.yellow,
                        x: 0, y: 6,
                        cost: {
                            resources: {
                                [Resources.wood]: 300,
                                [Resources.stone]: 10,
                            },
                            pinpins: {
                                [PinpinType.base]: 3,
                            },
                        },
                        upgrades: [
                            {
                                name: "Pinpin House",
                                desc: "Build a house for pinpins, every house can store x10 pinpins",
                                cost: {
                                    resources: {
                                        [Resources.wood]: 500,
                                        [Resources.stone]: 20,
                                    },
                                    pinpins: {
                                        [PinpinType.base]: 5,
                                    },
                                },
                            },
                            {
                                name: "Pinpin Village",
                                desc: "Build a village for pinpins, every house can store x100 pinpins",
                                cost: {
                                    resources: {
                                        [Resources.wood]: 5000,
                                        [Resources.stone]: 200,
                                    },
                                    pinpins: {
                                        [PinpinType.base]: 20,
                                    },
                                },
                            },
                            {
                                name: "Pinpin City",
                                desc: "Build a city for pinpins, every city can store x10000 pinpins",
                                cost: {
                                    resources: {
                                        [Resources.wood]: 500_000,
                                        [Resources.stone]: 200_000,
                                    },
                                    pinpins: {
                                        [PinpinType.base]: 2000,
                                    },
                                },
                            },
                        ],
                        children: {
                            pinpin_breeding: {
                                name: "Get a room",
                                desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 5% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every 5 seconds`,
                                icon: "b",
                                icon_colour: Colours.red,
                                x: 0, y: 8,
                                cost: {
                                    pinpins: {
                                        [PinpinType.base]: 10,
                                    },
                                },
                                upgrades: [
                                    {
                                        desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 15% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every 3 seconds`,
                                        cost:{
                                            pinpins: {
                                                [PinpinType.base]: 25,
                                            },
                                        },
                                    },
                                    {
                                        desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 30% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every second`,
                                        cost:{
                                            pinpins: {
                                                [PinpinType.base]: 70,
                                            },
                                        },
                                    },
                                    {
                                        desc: `Each couple of ${PinpinType.name(PinpinType.base)} have a 50% chance of breeding and creating another ${PinpinType.name(PinpinType.base)} every 0.5 seconds`,
                                        cost:{
                                            pinpins: {
                                                [PinpinType.base]: 1000,
                                            },
                                        },
                                    },
                                ],
                                children: {
                                    special_breed: {
                                        name: "Strong genetics",
                                        desc: "Any pair of specialised pinpins have a 5% chance of breeding every 10 seconds",
                                        icon: "s",
                                        icon_colour: Colours.blue,
                                        x: 2, y: 8,
                                        cost: {
                                            pinpins: {
                                                [PinpinType.explorer]: 1,
                                                [PinpinType.seller]:   1,
                                                [PinpinType.farmer]:   1,
                                            },
                                        },
                                        upgrades: [
                                            {
                                                desc: "Any pair of specialised pinpins have a 15% chance of breeding every 5 seconds",
                                                cost: {
                                                    pinpins: {
                                                        [PinpinType.explorer]: 5,
                                                        [PinpinType.seller]:   5,
                                                        [PinpinType.farmer]:   5,
                                                    },
                                                },
                                            },
                                            {
                                                desc: "Any pair of specialised pinpins have a 30% chance of breeding every 2.5 seconds",
                                                cost: {
                                                    pinpins: {
                                                        [PinpinType.explorer]: 25,
                                                        [PinpinType.seller]:   25,
                                                        [PinpinType.farmer]:   25,
                                                    },
                                                },
                                            },
                                            {
                                                desc: "Any pair of specialised pinpins have a 50% chance of breeding every second",
                                                cost: {
                                                    pinpins: {
                                                        [PinpinType.explorer]: 200,
                                                        [PinpinType.seller]:   200,
                                                        [PinpinType.farmer]:   200,
                                                    },
                                                },
                                            },
                                            {
                                                desc: "Any pair of specialised pinpins have a 75% chance of breeding every 0.5 seconds",
                                                cost: {
                                                    pinpins: {
                                                        [PinpinType.explorer]: 20_000,
                                                        [PinpinType.seller]:   20_000,
                                                        [PinpinType.farmer]:   20_000,
                                                    },
                                                },
                                            },
                                        ],
                                        children: {
                                            pinpin_genetics: {
                                                name: "Strong genetics",
                                                desc: "When breeding 2 specialised pinpins, there's a 5% chance that their offspring will have a +5% efficency boost",
                                                icon: "g",
                                                icon_colour: Colours.green,
                                                x: 4, y: 8,
                                                cost: {
                                                    resources: {
                                                        [Resources.money]: 1000,
                                                    },
                                                    pinpins: {
                                                        [PinpinType.explorer]: 25,
                                                        [PinpinType.seller]:   25,
                                                        [PinpinType.farmer]:   25,
                                                    },
                                                },
                                                upgrades: [
                                                    {
                                                        desc: "When breeding 2 specialised pinpins, there's a 15% chance that their offspring will have a +5% efficency boost",
                                                        cost: {
                                                            resources: {
                                                                [Resources.money]: 10_000,
                                                            },
                                                            pinpins: {
                                                                [PinpinType.explorer]: 200,
                                                                [PinpinType.seller]:   200,
                                                                [PinpinType.farmer]:   200,
                                                            },
                                                        },
                                                    },
                                                    {
                                                        desc: "When breeding 2 specialised pinpins, there's a 30% chance that their offspring will have a +15% efficency boost",
                                                        cost: {
                                                            resources: {
                                                                [Resources.money]: 1_000_000,
                                                            },
                                                            pinpins: {
                                                                [PinpinType.explorer]: 20_000,
                                                                [PinpinType.seller]:   20_000,
                                                                [PinpinType.farmer]:   20_000,
                                                            },
                                                        },
                                                    },
                                                    {
                                                        desc: "When breeding 2 specialised pinpins, there's a 50% chance that their offspring will have a +25% efficency boost",
                                                        cost: {
                                                            resources: {
                                                                [Resources.money]: 100_000_000,
                                                            },
                                                            pinpins: {
                                                                [PinpinType.explorer]: 2_000_000,
                                                                [PinpinType.seller]:   2_000_000,
                                                                [PinpinType.farmer]:   2_000_000,
                                                            },
                                                        },
                                                    },
                                                    {
                                                        desc: "When breeding 2 specialised pinpins, there's a 50% chance that their offspring will have a +50% efficency boost",
                                                        cost: {
                                                            resources: {
                                                                [Resources.money]: 100_000_000_000,
                                                            },
                                                            pinpins: {
                                                                [PinpinType.explorer]: 20_000_000,
                                                                [PinpinType.seller]:   20_000_000,
                                                                [PinpinType.farmer]:   20_000_000,
                                                            },
                                                        },
                                                    },
                                                ]
                                            }
                                        }
                                    }
                                }
                            },
                        }
                    }
                }
            }
        },
    },
});

export class Skill {
    constructor(id, skill, parent) {
        this.id = id;
        this.parent = parent;
        this.data = skill;
        this.upgrade = 0;
        this.unlocked = false;
        this.finished_upgrading = false;

        this.name = skill.name;
        this.desc = skill.desc;
        this.cost = skill.cost;

        this.on_unlocked = [];
    }

    tryUnlock() {
        if (!this.checkCost() || this.finished_upgrading) {
            return false;
        }
        this.unlocked = true;
        this.upgrade += 1;
        if (this.data.upgrades) {
            if (this.data.upgrades.length <= this.upgrade) {
                this.finished_upgrading = true;
            }
            else {
                const upgrade = this.data.upgrades[this.upgrade];
                
                if ("name" in upgrade) this.name = upgrade.name;
                if ("desc" in upgrade) this.desc = upgrade.desc;
                if ("cost" in upgrade) this.cost = upgrade.cost;
            }
        }

        for (const func of this.on_unlocked) {
            func();
        }

        return true;
    }

    checkCost() {
        if (!this.cost) {
            return true;
        }

        if ("resources" in this.cost) {
            for (const [id, count] of Object.entries(cost.resources)) {
                if (game.inventory.countOf(id) < count) {
                    return false;
                }
            }
        }
        if ("pinpins" in this.cost) {
            for (const [id, count] of Object.entries(cost.pinpins)) {
                if (game.village.countOf(id) < count) {
                    return false;
                }
            }
        }
        return true;
    }
}

export class SkillTree {
    constructor() {
        this.width = 7;
        this.height = 9;
        this.skills = [];

        this.addSkill(SkillsData.base, "base", null);
        this.skills["base"].tryUnlock();
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
}