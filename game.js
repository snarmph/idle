import { GetButton, BuildButton, Item } from "./ui.js"
import { addListener } from "./messages.js";
import { glob, Inventory, SaveData, Village, ResourceCondition, ItemCondition } from "./glob.js";
import { Resources, Items, Npcs } from "./enums.js";
import { makeInvisible } from "./utils.js";

class Game {
    constructor() {
        this.buttons = {
            get_wood: new GetButton("button-get-wood", "Break Tree", 3, Resources.wood, 3),
        }

        this.conditions = [
            new ItemCondition({ [Items.axe]: 0 }, () => {
                this.buttons.get_wood.setText("Chop Wood");
                this.buttons.get_wood.step = 5;
                this.buttons.get_wood.setTimeout(2);
                this.buttons.get_wood.updateTooltip();
            }),
            new ItemCondition({ [Items.axe]: 1 }, () => {
                this.buttons.get_wood.step = 10;
                this.buttons.get_wood.updateTooltip();
            }),
            new ItemCondition({ [Items.pick]: 0 }, () => {
                this.buttons["get_stone"] = new GetButton("button-get-stone", "Mine Stone", 4, Resources.stone, 2);
            }),
            new ItemCondition({ [Items.pick]: 1 }, () => {
                this.buttons.get_stone.step = 5;
                this.buttons.get_stone.updateTooltip();
            }),
/*
            new ResourceCondition(Resources.wood, 5, () => {
                this.buttons["make_wood_axe"] = new BuildButton(
                    "button-make-wood-axe", 
                    10,
                    Items.wood_axe,
                    { [Resources.wood]: 20 },
                );
            }),
            new ResourceCondition(Resources.wood, 5, () => {
                this.buttons["make_wood_pickaxe"] = new BuildButton(
                    "button-make-wood-pickaxe", 
                    10,
                    Items.wood_pick,
                    { [Resources.wood]: 20 },
                );
            }),
            new ItemCondition(Items.wood_axe, 1, () => {
                this.buttons.get_wood.step = 3;
                this.buttons.get_wood.setTimeout(2);
                this.buttons.get_wood.setText("Chop Tree");
                this.buttons.get_wood.updateTooltip();
            }),
            new ItemCondition(Items.wood_pick, 1, () => {
                this.buttons["get_stone"] = new GetButton("button-get-stone", "Mine Stone", 2, Resources.stone);
            }),
            new ResourceCondition([Resources.stone], 5, () => {
                this.buttons["make_stone_axe"] = new BuildButton(
                    "button-make-stone-axe", 
                    20,
                    Items.stone_axe,
                    { [Resources.stone]: 20, [Resources.wood]: 20 },
                );
            }),
            new ResourceCondition(Resources.stone, 5, () => {
                this.buttons["make_stone_pickaxe"] = new BuildButton(
                    "button-make-stone-pickaxe", 
                    20,
                    Items.stone_pick,
                    { [Resources.stone]: 20, [Resources.wood]: 20 },
                );
            }),
            new ItemCondition(Items.stone_axe, 1, () => {
                this.buttons.get_wood.step = 10;
                this.buttons.get_wood.updateTooltip();
            }),
            new ItemCondition(Items.stone_pick, 1, () => {
                this.buttons.get_stone.step = 3;
                this.buttons.get_stone.updateTooltip();
            }),
            new ResourceCondition(Resources.wood, 10, () => {
                this.buttons["make_wood_house"] = new BuildButton(
                    "button-make-wood-house",
                    60,
                    Items.wood_house,
                    { [Resources.wood]: 200 },
                );
            })
*/
        ];

        this.checkMessage(null);
    }

    checkMessage(msg) {
        for (let cond of this.conditions) {
            cond.step();
        }
    
        for (let i = 0; i < this.conditions.length; ++i) {
            if (this.conditions[i].unlocked()) {
                this.conditions[i] = this.conditions[this.conditions.length - 1];
                this.conditions.pop();
            }
        }
    }
}

function main() {
    glob.inventory = new Inventory();
    glob.village = new Village();
    glob["saveData"] = new SaveData();
    glob.game = new Game();

    //glob.saveData.save();
    //glob.saveData.load();

    addListener((msg) => {
        glob.game.checkMessage(msg);
        glob.saveData.save();
    })

    document.getElementById("reset-button").onclick = () => {
        glob.saveData.reset();
        location.reload();
    }

    // glob.village.addVillager(Npcs.villager);
    // glob.village.addVillager(Npcs.stone_miner);
}

main();