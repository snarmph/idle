import { tab_manager, make, Button, Category } from "script/ui.js"
import { game, gameInit } from "script/game.js"
import { Resources, Items } from "script/enums.js";

export function main() {
    gameInit();

    // debug.give("wood", 500);
    // debug.give("seeds", 500);
    // debug.give("wheat", 500);
    // debug.give("money", 500);
    
    // const c = make({});
    //tab_manager.add("house", "House", c);
    //tab_manager.add("options", "Options", c);
    //tab_manager.setActive(game.cave.getTabId());
}

window.addEventListener("load", () => {
    debug.give = (name, count = 1) => {
        let res = Resources[name];
        if (res !== undefined) {
            game.inventory.addResource(res, count);
        }
    }
    main();
})

/*
TODO:
 - in plant button check if you have enough seeds
 - in plant button check if you have a hoe or something when clicking
*/