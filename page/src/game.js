import { Logger, Colours }  from "src/log.js"
import { TabManager } from "src/ui/tab.js";

import { Inventory }  from "src/inventory.js";
import { Garden }  from "src/garden.js";
import { Village } from "src/village.js"
import { Options } from "src/options.js"
import { SkillTree } from "src/skill-tree.js";

import { ForestTab } from "src/ui/tabs/forest-tab.js"
import { GardenTab } from "src/ui/tabs/garden-tab.js"
import { OptionsTab } from "src/ui/tabs/options-tab.js"
import { SkillTreeTab } from "src/ui/tabs/skilltree-tab.js";

export class Game {
    constructor() {
        this.logger = new Logger();
        this.tab_manager = new TabManager();
        this.inventory = new Inventory();
        this.village = new Village();
        this.garden = new Garden();
        this.options = new Options();
        this.skill_tree = new SkillTree();
    }

    init() {
        this.tab_manager.add(new ForestTab());
        this.tab_manager.add(new GardenTab());
        this.tab_manager.add(new OptionsTab());
        this.tab_manager.add(new SkillTreeTab());

        this.tab_manager.setActive(ForestTab.getId());
        this.tab_manager.setActive(SkillTreeTab.getId());
    }

    log(msg, color = Colours.default) {
        this.logger.print(msg, color);
    }
}

export let game = null;

export function gameInit() {
    game = new Game();
    game.init();
}
