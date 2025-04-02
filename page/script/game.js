import { Inventory } from "script/inventory.js";
import { SaveData } from "script/save.js"
import { Logger } from "script/log.js"
import { IdleTab } from "./tabs/idle-tab.js"
import { GardenTab } from "./tabs/garden-tab.js"
import { Cave } from "script/cave.js"
import { tab_manager } from "script/ui.js"
import { Colours } from "script/enums.js"

export class Game {
    constructor() {
        this.logger = new Logger();
        // this.tabs = [];
        this.inventory = new Inventory();
        // this.save_data = new SaveData();
        // this.cave = new Cave();
    }

    init() {
        const idle_tab = new IdleTab();
        const garden_tab = new GardenTab();

        // this.tabs.push(idle_tab);
        // this.tabs.push(garden_tab);

        tab_manager.setActive(idle_tab.tab_id);
        // tab_manager.setActive(garden_tab.tab_id);
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
