import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { Button } from "src/ui/button.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js"
import { addListener, MessageTypes } from "src/messages.js"
import { HouseLevels, TileState } from "src/garden.js"
import { Colours } from "src/log.js"
import { formatRaw } from "src/utils/num.js"

class TileButton extends Button {
    constructor(index, parent) {
        super(
            `garden-tile-${index}`, parent, "tile-text", 1, () => {
                this.nextState();
            }
        )
        this.index = index;
        this.button.classList.add("garden-tile-button");
        this.addOnClick(() => this.removeCost());
        this.update();
    }

    update() {
        const tile = game.garden.tiles[this.index];
        const state = TileState.fromIndex(tile.state);
        let text = state.name;
        if ("icon" in state) {
            const colour = Colours.fromIndex(state.icon.colour);
            text += ` <span class="garden-tile-emoji" style="color: var(--${colour})">${state.icon.text}</span>`
        }
        this.setButtonContent(text);
        this.setTimeout(state.time * 0.1);

        if (tile.state === TileState.growing) {
            this.click();
        }

        if (!tile.check()) {
            this.disable();
        }
    }

    removeCost() {
        const tile = game.garden.tiles[this.index];
        const state = TileState.fromIndex(tile.state);
        if ("cost" in state) {
            for (const [id, count] of Object.entries(state.cost)) {
                game.inventory.remove(id, count);
            }
        }
    }

    nextState() {
        game.garden.tiles[this.index].next();
    }
}

export class GardenTab extends BaseTab {
    constructor() {
        super(GardenTab.getId(), "House");

        this.tiles_elem = ui.htmlFromStr(
            `<div class="garden-tiles"></div>`,
            this.content_element
        );

        this.tiles = [];

        addListener(MessageTypes.houseUpgrade, (data) => {
            this.onHouseUpgrade(data.level);
        })
    }

    /* overload */ 
    static getId() {
        return "garden"; 
    }

    /* overload */ 
    onInit() {
        game.garden.upgrade();
        game.garden.upgrade();
        game.garden.upgrade();
        this.show();
    }

    /* overload */ 
    onVisible() {
        addListener(
            MessageTypes.resourceUpdate, 
            () => {
                for (let i = 0; i < this.tiles.length; ++i) {
                    const garden_tile = game.garden.tiles[i];
                    if (garden_tile.check()) {
                        this.tiles[i].enable();
                    }
                    else {
                        this.tiles[i].disable();
                    }
                }
            }
        );
        addListener(
            MessageTypes.gardenUpdate,
            (data) => {
                this.tiles[data.index].update();
                if (data.harvest) {
                    let msg = "Harvested ";
                    for (let i = 0; i < data.harvest.length; ++i) {
                        const res = data.harvest[i];
                        msg += `${res.name}: ${formatRaw(res.count)}`;
                        if (i + 1 < data.harvest.length) msg += ", ";
                    }
                    game.log(msg);
                }
            }
        )
    }

    /* overload */ 
    onSelected() {

    }

    /* overload */ 
    onExitSelected() {

    }

    onHouseUpgrade(level) {
        this.updateName(HouseLevels.name(level));
        const old_len = this.tiles.length;
        const len = game.garden.tiles.length;
        for (let i = old_len; i < len; ++i) {
            this.tiles.push(new TileButton(i, this.tiles_elem));
        }
    }
}