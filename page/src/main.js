import { game, gameInit } from "src/game.js"
import { Resources } from "src/inventory.js"
import { PinpinType } from "./village.js";

function main() {
    gameInit()

    //debug.give("wood", 1e5);
    //debug.give("stone", 1e5);
    //debug.give("seeds", 1e5);

    debug.pinpin("base", 5);
}

window.addEventListener("load", () => {
    debug.give = (name, count = 1) => {
        game.inventory.add(Resources[name], count);
    }

    debug.pinpin = (type, count = 1) => {
        game.village.add(PinpinType[type], count);
    }

    debug.renderFps = (fps) => {
        game.render.updateFps(fps);
    }

    debug.logicFps = (fps) => {
        game.logic.updateFps(fps);
    }

    debug.save = () => {

    }

    debug.load = () => {

    }

    debug.clearSave = () => {

    }

    main();
})