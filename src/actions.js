import { randomResources } from "src/utils/rand.js"
import { Resources } from "src/inventory.js"
import { game } from "src/game.js"
import { sendMsg, MessageTypes } from "src/messages.js";
import { PinpinType } from "src/village.js"

export function exploreForest(pinpin_count = 1) {
    const found = randomResources({
        [Resources.wood]: { min: 1, max: 5 },
        [Resources.seeds]: { atleast: 70 },
        [Resources.stone]: { atleast: 98 }
    });

    const items = found.getResults();
    for (const res of items) {
        game.inventory.add(res.id, res.count * pinpin_count);
    }

    return items;
}

export function trySell(count = 1, pinpin_count = 1) {
    let res_to_sell = null;
    let max_value = 0;
    for (const [id, _] of Object.entries(game.inventory.resources)) {
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
    const max_count = game.inventory.countOf(res_to_sell);
    const sell_count = Math.min(count * pinpin_count, max_count);
    game.inventory.sell(res_to_sell, sell_count);
}

export function farm(pinpin_count = 1) {
    for (const tile of game.garden.tiles) {
        let needed = tile.getPinpinNeeded();
        if (pinpin_count >= needed && tile.tryNext()) {
            pinpin_count -= needed;
            if (pinpin_count <= 0) {
                return;
            }
        }
    }
}