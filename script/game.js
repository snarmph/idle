import { Inventory } from "script/inventory.js";
import { SaveData } from "script/save.js"
import { Logger } from "script/log.js"
import { IdleTab } from "tabs/idle-tab.js"
import { GardenTab } from "tabs/garden-tab.js"
import { tab_manager } from "script/ui.js"
import { Colours } from "script/enums.js"
import { Village, MinionType } from "script/minion.js"
import { VillageTab } from "tabs/minion-tab.js"

export class Game {
    constructor() {
        this.logger = new Logger();
        this.inventory = new Inventory();
        this.village = new Village();
        this.forest = null;
        this.garden = null;
        // this.save_data = new SaveData();
    }

    init() {
        this.forest = new IdleTab();
        this.garden = new GardenTab();

        const village_tab = new VillageTab();

        tab_manager.setActive(this.forest.tab_id);
        tab_manager.setActive(village_tab.tab_id);
        // tab_manager.setActive(this.garden.tab_id);
        // this.inventory.init();
        // this.save_data.init();
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
