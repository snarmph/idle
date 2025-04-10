import { game, gameInit } from "src/game.js"
import { Resources } from "src/inventory.js"
import { PinpinType } from "./village.js";

function main() {
    gameInit()

    //debug.give("wood", 1e5);
    //debug.give("stone", 1e5);
    //debug.give("seeds", 1e5);
}

window.addEventListener("load", () => {
    debug.give = (name, count = 1) => {
        game.inventory.add(Resources[name], count);
    }

    debug.pinpin = (type, count = 1) => {
        game.village.add(PinpinType[type], count);
    }

    debug.save = () => {

    }

    debug.load = () => {

    }

    debug.clearSave = () => {

    }

    main();
})