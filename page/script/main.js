import { tab_manager, make, Button, Category } from "script/ui.js"
import { game, gameInit } from "script/game.js"
import { Resources, Items } from "script/enums.js";

export function main() {
    gameInit();
    
    // const c = make({});
    //tab_manager.add("house", "House", c);
    //tab_manager.add("options", "Options", c);
    //tab_manager.setActive(game.cave.getTabId());
}

main();

window.addEventListener("load", () => {
    debug.give = (name, count = 1) => {
        let res = Resources[name];
        if (res !== undefined) {
            game.inventory.addResource(res, count);
        }
    }
})