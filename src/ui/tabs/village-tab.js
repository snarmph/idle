import * as ui from "src/ui/base.js"
import { SimpleButton } from "src/ui/button.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { addListener, MessageTypes } from "src/messages.js"
import { PinpinType } from "src/village.js";
import { formatResource } from "src/utils/num.js"
import { Resources } from "src/inventory.js";

export class VillageTab extends BaseTab {
    constructor() {
        super(VillageTab.getId(), "Pinpins");

        this.village_elem = ui.htmlFromStr(
            `<div class="village"></div>`,
            this.content_element
        );
    }
    
    /* overload */ 
    static getId() {
        return "village";
    }

    /* overload */ 
    onInit() {
        this.show();
    }

    /* overload */ 
    onVisible() {
        addListener(MessageTypes.pinpinUpdate, 
            (data) => {
                this.update();
            }
        );
        this.update();
    }

    /* overload */ 
    onSelected() {
    }

    /* overload */ 
    onExitSelected() {
    }

    update() {
        this.village_elem.replaceChildren();
        for (const [id, data] of PinpinType.each()) {
            const pinpin = game.village.get(id);
            const count = pinpin.count;

            const item = ui.htmlFromStr(
                `<div class="pinpin-item"></div>`,
                this.village_elem
            );
            ui.htmlFromStr(`
                <div class="pinpin-data">
                    <div class="pinpin-name">${data.name}:</div>
                    <div class="pinpin-count">${count}</div>
                </div>`,
                item
            );
            const buttons = ui.htmlFromStr(`
                <div class="pinpin-buttons">
                </div>
                `,
                item
            );

            const sell = new SimpleButton(
                `sell-${PinpinType.key(id)}`,
                buttons,
                "Sell",
                () => {
                    game.village.remove(id);
                    game.inventory.add(Resources.money, data.value * 0.5);  
                }
            )
            sell.setTooltipText(formatResource(Resources.money, data.value * 0.5));

            const pause = new SimpleButton(
                `pause-${PinpinType.key(id)}`,
                buttons,
                pinpin.isPaused() ? "Resume" : "Pause",
                () => {
                    if (pinpin.isPaused()) pinpin.unpause()
                    else                   pinpin.pause();
                }
            )

            if (count <= 0) {
                sell.disable();
                pause.disable();
            }
        }
    }
}