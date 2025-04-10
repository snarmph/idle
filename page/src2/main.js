import { game, gameInit } from "src/game.js"
import { Resources } from "src/inventory.js";
import { PinpinType } from "./village.js";
import { Colours } from "src/log.js"
// import { MinionType } from "src/minion.js";

export function main() {
    gameInit();

    // debug.give("wood", 500);
    // debug.give("seeds", 5);
    // debug.give("wheat", 500);
    // debug.give("money", 500);

    // game.village.add(MinionType.base, 5);
    // game.village.add(MinionType.farmer, 10);
    // game.village.add(MinionType.seller, 1);
}

window.addEventListener("load", () => {
    debug.give = (name, count = 1) => {
        let res = Resources[name];
        if (res !== undefined) {
            game.inventory.add(res, count);
        }
    }
    debug.pinpin = (type, count = 1) => {
        let pin = PinpinType[type];
        if (pin !== undefined) {
            game.village.add(pin, count);
        }
    }
    debug.save = () => {
        game.save();
    }
    debug.load = () => {
        game.load();
    }
    debug.clearSave = () => {
        game.save_data.clear();
        location.reload();
    }
    main();
})
