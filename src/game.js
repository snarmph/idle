import { Inventory }  from "src/inventory.js";
import { Garden }  from "src/garden.js";
import { Logger, Colours }  from "src/log.js"
import { ForestTab } from "src/ui/tabs/forest-tab.js"
import { GardenTab } from "src/ui/tabs/garden-tab.js"
import { TabManager } from "src/ui/tab.js";
// import tab_manager  from "src/ui.js"
// import { Village, MinionType } from "src/minion.js"
import { Village } from "src/village.js"
// import { VillageTab } from "tabs/minion-tab.js"

export class Game {
    constructor() {
        this.logger = new Logger();
        this.tab_manager = new TabManager();
        this.inventory = new Inventory();
        this.village = new Village();
        this.garden = new Garden();
    }

    init() {
        this.tab_manager.add(new ForestTab());
        this.tab_manager.add(new GardenTab());
        this.tab_manager.setActive(ForestTab.getId());
        // const forest_tab = new IdleTab();
        // const garden_tab = new GardenTab();

        // const village_tab = new VillageTab();

        // tab_manager.setActive(forest_tab.tab_id);
        // tab_manager.setActive(village_tab.tab_id);
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
