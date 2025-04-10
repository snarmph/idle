import { Logger, Colours } from "src/log.js";

import { Options } from "src/options.js";
import { Inventory } from "src/inventory.js";
import { Garden } from "src/garden.js";

import { TabManager } from "src/ui/tab.js";
import { OptionsTab } from "src/ui/tabs/options-tab.js";
import { ForestTab } from "src/ui/tabs/forest-tab.js";
import { GardenTab } from "src/ui/tabs/garden-tab.js";
import { Village } from "src/village.js";


class Game {
    constructor() {
        this.start_time = document.timeline.currentTime;
        this.prev_time = this.start_time;
        this.fps = 60;
        this.dt = 1000.0 / this.fps;
        this.accumulated = 0;

        this.frame = 0;

        this.tab_manager = new TabManager();
    }

    init() {
        this.logger = new Logger();

        this.options   = new Options();
        this.inventory = new Inventory();
        this.garden    = new Garden();
        this.village   = new Village();

        this.tab_manager.add(new ForestTab());
        this.tab_manager.add(new GardenTab());
        this.tab_manager.add(new OptionsTab());

        this.tab_manager.setActive(ForestTab.getId());

        this.loop(this.now());
    }

    now() {
        return document.timeline.currentTime;
    }

    loop(time) {
        let passed = time - this.prev_time;
        if (passed >= this.dt) {
            this.prev_time = time;

            while (passed >= this.dt) {
                passed -= this.dt;
                this.frame++;
                this.tick()
            }

            this.accumulated += passed;

            while (this.accumulated >= this.dt) {
                this.accumulated -= this.dt;
                this.frame++;
                this.tick();
            }
        }

        requestAnimationFrame((time) => this.loop(time))
    }

    tick() {
        this.tab_manager.tick(game.dt);

        this.garden.tick(game.dt);
        this.village.tick(game.dt);
    }

    save() {

    }

    load() {

    }

    log(msg, col = Colours.default) {
        this.logger.print(msg, col);
    }
}

export let game = null;
export function gameInit() {
    game = new Game();
    game.init();
}