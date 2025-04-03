import { makeObjectEnum, randomResources } from "script/utils.js"
import { Resources, Items } from "script/enums.js"
import { game } from "script/game.js"

export function exploreForest() {
    const found = randomResources({
        [Resources.wood]: { min: 1, max: 5 },
        [Resources.seeds]: { atleast: 90 },
        [Resources.stone]: { atleast: 98 }
    });

    const items = found.getResults();
    for (const item of items) {
        game.inventory.addResource(item.id, item.count);
    }

    return found;
}

export function trySell(count = 1) {
    let res_to_sell = null;
    let max_value = 0;
    for (const [id, res] of Object.entries(game.inventory.resources)) {
        const value = Resources.get(id, "value", null);
        if (value === null) continue;
        if (value > max_value) {
            max_value = value;
            res_to_sell = id;
        }
    }
    if (res_to_sell === null) {
        return;
    }
    game.inventory.sellResource(res_to_sell, count);
}

export function farm() {
    for (const tile of game.garden.tiles) {
        if (tile.isEnabled()) {
            tile.click();
            return;
        }
    }
}
