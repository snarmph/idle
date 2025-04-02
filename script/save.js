import { Resources, Items } from "script/enums.js"
import { game } from "script/game.js"

export class SaveData {
    constructor() {
        //this.init();
    }

    reset() {
        localStorage.clear();
    }

    init() {
        this.reset();

        // if (this.hasSaveData()) {
        //     this.load();
        //     return;
        // }

        for (const [k, _] of Resources.each()) {
            game.inventory.addResource(k, 0, 0);
        }

        for (const [k, _] of Items.each()) {
            game.inventory.addItem(k, 0, 0, -1);
        }
    }
}