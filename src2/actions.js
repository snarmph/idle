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

export function mineStone(pinpin_count = 1) {
    const found = randomResources({
        [Resources.stone]: { min: 1, max: 8 },
        [Resources.money]: { atleast: 98, max: 2.0 },
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
    let sell_count = 0;
    for (const [id, res] of Object.entries(game.inventory.resources)) {
        const res_value = Resources.get(id, "value", null);
        if (res_value === null) continue;

        const res_sell_count = Math.min(count * pinpin_count, res.count);
        const value = res_value * res_sell_count;

        if (value > max_value) {
            max_value = value;
            res_to_sell = id;
            sell_count = res_sell_count;
        }
    }
    if (res_to_sell === null || sell_count === 0) {
        return;
    }
    console.log("selling", Resources.name(res_to_sell), sell_count);
    game.inventory.sell(res_to_sell, sell_count);
}

export function farm(pinpin_count = 1) {
    for (const tile of game.garden.tiles) {
        let needed = tile.getPinpinNeeded();
        if (pinpin_count >= needed && tile.tryNext(true)) {
            pinpin_count -= needed;
            if (pinpin_count <= 0) {
                return;
            }
        }
    }
}