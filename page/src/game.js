import { Logger, Colours } from "src/log.js";
import { Displayer } from "src/ui/displayer.js";
import { Tooltip } from "src/ui/tooltip.js";

import { Options } from "src/options.js";
import { Inventory } from "src/inventory.js";
import { Garden } from "src/garden.js";
import { Village } from "src/village.js";
import { SkillTree } from "src/skilltree.js";

import { TabManager } from "src/ui/tab.js";
import { OptionsTab } from "src/ui/tabs/options-tab.js";
import { ForestTab } from "src/ui/tabs/forest-tab.js";
import { GardenTab } from "src/ui/tabs/garden-tab.js";
import { SkillTreeTab } from "src/ui/tabs/skilltree-tab.js";

class Ticker {
    constructor(fps, func) {
        this.frame = 0;
        this.tick = func;
        this.updateFps(fps);
    }

    updateFps(fps) {
        this.fps = fps;
        this.dt = 1000 / fps;
        this.prev_time = document.timeline.currentTime;
        this.accumulated = 0;
    }

    loop(time) {
        let passed = time - this.prev_time;

        if (passed >= this.dt) {
            this.prev_time = time;

            while (passed >= this.dt) {
                passed -= this.dt;
                this.frame++;
                this.tick(this.dt)
            }

            this.accumulated += passed;

            while (this.accumulated >= this.dt) {
                this.accumulated -= this.dt;
                this.frame++;
                this.tick(this.dt);
            }
        }
    }
}

class Game {
    constructor() {
        this.start_time = document.timeline.currentTime;
        this.prev_time = this.start_time;

        this.logic  = new Ticker(30, (dt) => this.logicTick(dt));
        this.render = new Ticker(50, (dt) => this.renderTick(dt));

        this.tab_manager = new TabManager();
    }

    init() {
        this.logger = new Logger();
        this.displayer = new Displayer();
        this.tooltip = new Tooltip();

        this.options   = new Options();
        this.inventory = new Inventory();
        this.garden    = new Garden();
        this.village   = new Village();
        this.skilltree = new SkillTree();

        this.tab_manager.add(new ForestTab());
        this.tab_manager.add(new GardenTab());
        this.tab_manager.add(new SkillTreeTab());
        this.tab_manager.add(new OptionsTab());

        this.tab_manager.setActive(ForestTab.getId());

        this.loop(this.now());
    }

    now() {
        return document.timeline.currentTime;
    }

    loop(time) {
        this.logic.loop(time);
        this.render.loop(time);

        requestAnimationFrame((time) => this.loop(time))
    }

    logicTick(dt) {
        this.tab_manager.logicTick(dt);
        this.garden.logicTick(dt);
        this.village.logicTick(dt);
    }

    renderTick(dt) {
        this.tab_manager.renderTick(dt);
        this.displayer.renderTick(dt);
        this.tooltip.renderTick(dt);
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