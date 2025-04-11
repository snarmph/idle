import * as ui from "src/ui/base.js"
import * as num from "src/utils/num.js"
import * as loop from "src/utils/loop.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js"
import { PinpinType } from "src/village.js"

export class Displayer {
    constructor() {
        this.categories = {
            resources: document.getElementById("resources-category"), 
            pinpins:   document.getElementById("pinpins-category"), 
        }

        for (const [_, cat] of Object.entries(this.categories)) {
            ui.setVisible(cat, false);
        }

        this.res_data = [];
        this.res_data.length = Resources.count();
        for (const [id, res] of Resources.each()) {
            const container = ui.htmlFromStr(`
                <div id="resource-${id}" class="item-container">
                    <div class="item-name">${res.name}</div>
                </div>`, 
                this.categories.resources
            );
            const count = ui.htmlFromStr(
                `<div class="item-quantity">0</div>`, 
                container
            );

            this.res_data[id] = {
                container: container,
                count: count,
            };
            ui.setVisible(container, false);
        }

        this.pinpins_data = [];
        this.pinpins_data.length = PinpinType.count();
        for (const [id, pin] of PinpinType.each()) {
            const container = ui.htmlFromStr(`
                <div id="pinpin-${id}" class="item-container">
                    <div class="item-name">${pin.name}</div>
                </div>`, 
                this.categories.pinpins
            );
            const count = ui.htmlFromStr(
                `<div class="item-quantity">0</div>`, 
                container
            );

            container.addEventListener("mouseover", () => this.hoverPinpin(id));
            container.addEventListener("mouseout", () => game.tooltip.setVisible(false));

            this.pinpins_data[id] = {
                container: container,
                count: count,
            };
            ui.setVisible(container, false);
        }

        this.checks = [
            () => {
                if (game.inventory.count() === 0) {
                    return false;
                }
                ui.setVisible(this.categories.resources);
                return true;
            },
            () => {
                if (game.village.count() === 0) {
                    return false;
                }
                ui.setVisible(this.categories.pinpins);
                return true;
            },
        ]
    }

    renderTick(dt) {
        loop.check(this.checks);

        for (const id in game.inventory.resources) {
            const res = game.inventory.resources[id];
            const data = this.res_data[id];
            if (res.total > 0) {
                ui.setVisible(data.container);
            }
            data.count.textContent = num.format(res.count);
        }

        for (const id in game.village.pinpins) {
            const pin = game.village.pinpins[id];
            const data = this.pinpins_data[id];
            if (pin.total > 0) {
                ui.setVisible(data.container);
            }
            data.count.textContent = num.format(pin.count);
        }
    }

    hoverPinpin(type) {
        const pin = PinpinType.fromIndex(type);

        game.tooltip.fill(pin.name.trim(), pin.desc.trim(), pin.find ? "" : "+? per second");

        if (pin.find) {
            game.tooltip.cost_elem.replaceChildren();

            const pin_count = game.village.countOf(type);

            for (const [id, count] of Object.entries(pin.find)) {
                const text = `${Math.sign(count) > 0 ? "+":""}${num.format(count * pin_count)} ${Resources.name(id)} per second`;
                ui.htmlFromStr(`
                    <div class="tooltip-cost-item tooltip-cost-available">
                        ${text}
                    </div>`,
                    game.tooltip.cost_elem
                )
            }
        }

        game.tooltip.setVisible(true);
    }
}