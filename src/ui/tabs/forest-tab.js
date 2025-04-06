import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js"
import { MessageTypes, addListener, removeListener, sendMsg } from "src/messages.js"
import { Button, SellButton } from "src/ui/button.js"
import { formatResource } from "src/utils/num.js"
import { HouseLevels } from "src/garden.js"
import { ResourceCondition } from "src/condition.js"
import { getRandomInt } from "src/utils/rand.js"
import { Colours } from "src/log.js"
import { formatRaw } from "src/utils/num.js"
import * as actions from "src/actions.js"
import { Pinpin, PinpinType } from "../../village.js"

let seller_animation = [];

export class ForestTab extends BaseTab {
    constructor() {
        super(ForestTab.getId(), "Forest");

        this.grid_elem = ui.htmlFromStr(
            `<div class="forest-grid"></div>`,
            this.content_element
        )
        this.get_elem = ui.htmlFromStr(
            `<div class="forest-get-buttons"></div>`,
            this.grid_elem
        );
        this.build_elem = ui.htmlFromStr(
            `<div class="forest-build-buttons"></div>`,
            this.grid_elem
        );
        this.data_elem = ui.htmlFromStr(
            `<div class="forest-data"></div>`,
            this.grid_elem
        );

        this.categories = {
            resources: new ui.Category("forest-resources", this.data_elem, "Resources"),
            pinpins: new ui.Category("forest-pinpins", this.data_elem, "Pinpins"),
            seller: new ui.Category("forest-seller", this.grid_elem, "Seller"),
        }

        for (const [_, cat] of Object.entries(this.categories)) {
            ui.makeInvisible(cat.element);
        }

        this.res_data = [];
        this.res_data.length = Resources.count();
        for (const [id, res] of Resources.each()) {
            const container = ui.htmlFromStr(
                `
                <div id="resource-${id}" class="forest-item">
                    <div class="item-name">${res.name}</div>
                </div>
                `, 
                this.categories.resources.element
            );
            const count = ui.htmlFromStr(
                `<div class="item-quantity">0</div>`, 
                container
            );

            this.res_data[id] = {
                container: container,
                count: count,
            };
            ui.makeInvisible(container);
        }

        this.pinpins_data = [];
        this.pinpins_data.length = PinpinType.count();
        for (const [id, pin] of PinpinType.each()) {
            const container = ui.htmlFromStr(
                `
                <div id="pinpin-${id}" class="forest-item">
                    <div class="item-name">${pin.name}</div>
                </div>
                `, 
                this.categories.pinpins.element
            );
            const count = ui.htmlFromStr(
                `<div class="item-quantity">0</div>`, 
                container
            );

            this.pinpins_data[id] = {
                container: container,
                count: count,
            };
            ui.makeInvisible(container);
        }

        this.sell_buttons = {
            explore_forest: new Button(
                "button-explore",
                this.get_elem,
                "Explore Wilderness",
                1,
                () => {
                    const found = actions.exploreForest();
                    let msg = "Found ";
                    for (let i = 0; i < found.length; ++i) {
                        const res = found[i];
                        msg += `${res.name}: ${formatRaw(res.count)}`
                        if (i + 1 < found.length) msg += ", ";
                    }
                    game.log(msg);
                }
            ),
        };

        this.buy_buttons = {
            house_upgrade: new Button(
                "upgrade-house",
                this.build_elem,
                "House",
                1,
                () => {
                    if (game.garden.house === HouseLevels.none) {
                        game.tab_manager.show("garden");
                    }
                    if (game.garden.upgrade()) {
                        this.updateHouseButton();
                    }
                }
            )
        }

        ui.makeInvisible(this.buy_buttons.house_upgrade.button);

        this.house_condition = null;
        this.updateHouseButton();

        addListener(
            MessageTypes.resourceUpdate, 
            (data) => {
                const res = this.res_data[data.id];
                res.count.textContent = formatRaw(data.count);
                ui.makeVisible(res.container);
                ui.makeVisible(this.categories.resources.element);

                this.stepHouseCondition();
            }
        );

        addListener(
            MessageTypes.pinpinUpdate,
            (data) => {
                const pin = this.pinpins_data[data.type];
                pin.count.textContent = formatRaw(data.count);
                ui.makeVisible(pin.container);
                ui.makeVisible(this.categories.pinpins.element);
            }
        )

        // == SELLER ==================================

        this.seller = {
            visible: false,
            timer: null,
            listen_id: null,
            buttons: [],
            conditions: [
                new ResourceCondition(
                    { [Resources.wheat]: 20 },
                    () => {
                        if (this.is_active) {
                            this.showSeller();
                        }
                        this.seller.visible = true;
                        this.seller.buttons.push(new SellButton(
                            Resources.wheat, 5,
                            this.categories.seller.element
                        ));
                        game.log("A merchant has appeared", Colours.yellow);
                        sendMsg(MessageTypes.eventUpdate);
                    }
                ),
                new ResourceCondition(
                    { [Resources.money]: 10 },
                    () => {
                        // this.seller.buttons.push();
                    }
                )
            ]
        }

        this.seller.listen_id = addListener(
            MessageTypes.resourceUpdate,
            (data) => {
                this.updateSellerConditions();
            }
        );

        this.updateSellerConditions();
    }

    updateHouseButton() {
        const upgrade_level = game.garden.house + 1;
        const upgrade = HouseLevels.fromIndex(upgrade_level);
        const btn = this.buy_buttons.house_upgrade;

        const show_cost = upgrade.show;
        const buy_cost = upgrade.cost;

        btn.setText(upgrade.name);
        btn.setTimeout(upgrade.time);

        let tooltip = [];
        for (const [id, count] of Object.entries(buy_cost)) {
            tooltip.push(formatResource(id, count));
        }
        btn.setTooltip(tooltip);

        btn.disable();
        ui.makeInvisible(btn.button);

        const show_cond = new ResourceCondition(show_cost, () => ui.makeVisible(btn.button), true);
        const buy_cond = new ResourceCondition(buy_cost);
        this.house_condition = {
            show: show_cond,
            buy: buy_cond,
        };

        this.stepHouseCondition();
    }

    stepHouseCondition() {
        if (!this.house_condition) return;
        const show = this.house_condition.show;
        if (!show.step()) {
            return;
        }
        const buy = this.house_condition.buy;
        const btn = this.buy_buttons.house_upgrade;
        if (buy.step()) {
            buy.reset();
            btn.enable();
        }
        else {
            btn.disable();
        }
    }

    /* overload */ 
    static getId() {
        return "forest"; 
    }

    /* overload */ 
    onInit() {
        this.show();
    }

    /* overload */ 
    onSelected() {
        if (this.seller.visible) {
            this.showSeller();
        }
    }

    /* overload */ 
    onExitSelected() {
        if (this.seller.visible) {
            clearTimeout(this.seller.timer);
            this.seller.timer = null;
            ui.makeInvisible(this.extra.parentElement);
        }
    }

    showSeller() {
        ui.makeVisible(this.extra.parentElement);
        ui.makeVisible(this.categories.seller.element);
        this.animateSeller();
    }

    updateSellerConditions() {
        if (this.seller.conditions.length === 0) {
            removeListener(MessageTypes.resourceUpdate, this.seller.listen_id);
            this.seller.listen_id = null;
            return;
        }
        const cond = this.seller.conditions[0];
        if (cond.step()) {
            this.seller.conditions.shift();
        }
    }

    animateSeller() {
        this.extra.textContent = seller_animation[0];
        const timeout = getRandomInt(5000, 10000);
        clearTimeout(this.seller.timer);
        this.seller.timer = setTimeout(
            () => {
                clearTimeout(this.seller.timer);
                this.extra.textContent = seller_animation[1];
                this.seller.timer = setTimeout(
                    () => {
                        this.animateSeller();
                    },
                    100
                );
            },
            timeout
        );
    }
}

seller_animation = [
`
          _.-""""-._
         /.-......-.\\
        //          \\\\
        ||          ||
        ||.--    --.||
        /|  . || .  |\\
        \\    (__)    /
         |  ,____,  |
          \\  \`--'  /
       _./\`'.____.'\`\\._
   _.::::|  |    |  |::::._
 .::::::::\\  \\  /  /::::::::.
/:::::::::::|/:\\/:\\|::::::::::\\
`,
`
          _.-""""-._
         /.-......-.\\
        //          \\\\
        ||          ||
        ||.--    --.||
        /| __ || __ |\\
        \\    (__)    /
         |  ,____,  |
          \\  \`--'  /
       _./\`'.____.'\`\\._
   _.::::|  |    |  |::::._
 .::::::::\\  \\  /  /::::::::.
/:::::::::::|/:\\/:\\|::::::::::\\
`
]