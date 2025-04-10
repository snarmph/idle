import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { Button, CooldownButton } from "src/ui/button.js"
import * as num from "src/utils/num.js"
import * as rand from "src/utils/rand.js"
import { Resources } from "src/inventory.js"
import { HouseLevels } from "src/garden.js"
import { PinpinType } from "src/village.js"
import { GardenTab } from "src/ui/tabs/garden-tab.js"
import { Seller } from "src/seller.js"

export class ForestTab extends BaseTab {
    constructor() {
        super(ForestTab.getId(), "Forest");

        this.do_elem = ui.htmlFromStr(
            `<div class="forest-do-buttons"></div>`,
            this.content_element
        );
        this.make_elem = ui.htmlFromStr(
            `<div class="forest-make-buttons"></div>`,
            this.content_element
        );

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
            const container = ui.htmlFromStr(
                `<div id="resource-${id}" class="item-container">
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
            const container = ui.htmlFromStr(
                `
                <div id="pinpin-${id}" class="item-container">
                    <div class="item-name">${pin.name}</div>
                </div>
                `, 
                this.categories.pinpins
            );
            const count = ui.htmlFromStr(
                `<div class="item-quantity">0</div>`, 
                container
            );

            this.pinpins_data[id] = {
                container: container,
                count: count,
            };
            ui.setVisible(container, false);
        }

        this.do_buttons = {
            explore: new CooldownButton(
                "button-explore",
                this.do_elem,
                "Explore Wilderness",
                1,
                () => {
                    const found = rand.loot({
                        [Resources.wood]: { min: 1, max: 5 },
                        [Resources.seeds]: { atleast: 70 },
                        [Resources.stone]: { atleast: 98 },
                    });
                    
                    const items = found.getResults();
                    let msg = "Found ";
                    for (const i in items) {
                        const res = items[i];
                        game.inventory.add(res.id, res.count);

                        if (i > 0) msg += ", ";
                        msg += `${num.format(res.count)} ${res.name}`;
                    }
                    msg += " while exploring";
                    game.log(msg);
                }
            ),
            mine: new CooldownButton(
                "button-mine",
                this.do_elem,
                "Go Mine",
                2,
                () => {
                    const found = rand.loot({
                        [Resources.stone]: { min: 1, max: 8 },
                    });
                    
                    const items = found.getResults();
                    let msg = "Found ";
                    for (const i in items) {
                        const res = items[i];
                        game.inventory.add(res.id, res.count);

                        if (i > 0) msg += ", ";
                        msg += `${num.format(res.count)} ${res.name}`;
                    }
                    msg += " while mining";
                    game.log(msg);
                }
            )
        };

        this.do_buttons.mine.setVisible(false);

        this.make_buttons = {
            house_upgrade: new CooldownButton(
                "upgrade-house",
                this.make_elem,
                "House",
                1,
                () => {
                    if (game.garden.level === HouseLevels.none) {
                        game.tab_manager.show("garden");
                    }
                    this.make_buttons.house_upgrade.setVisible(false);
                    game.garden.upgrade();
                    game.tab_manager.tabs[GardenTab.getId()].onHouseUpgrade();
                    if (game.garden.level + 1 >= HouseLevels.count()) {
                        delete this.make_buttons.house_upgrade;
                    }
                    else {
                        makeHouseCheck();
                    }
                },
                () => {
                    const cost = HouseLevels.get(game.garden.level + 1, "cost");
                    for (const [id, count] of Object.entries(cost)) {
                        game.inventory.rem(id, count);
                    }
                }
            )
        }

        this.make_buttons.house_upgrade.setVisible(false);
        const makeHouseCheck = () => {
            const level = HouseLevels.fromIndex(game.garden.level + 1);
            const btn = this.make_buttons.house_upgrade;
            const func = () => {
                if (!game.inventory.hasEnough(level.show)) return false;

                const cost = [];
                for (const [id, count] of Object.entries(level.cost)) {
                    cost.push(`-${num.format(count)} ${Resources.name(id)}`);
                }
                btn.setText(level.name);
                btn.setTooltipFromArr(cost);
                btn.setVisible();

                return true;
            }
            this.checks.push(() => func());
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
            () => {
                if (game.garden.level === 0) {
                    return false;
                }

                this.do_buttons.mine.setVisible();
                return true;
            },
        ]

        makeHouseCheck();

        this.seller = new Seller(this.content_element);
    }

    /* override */ 
    static getId() {
        return "forest";
    }

    /* override */ 
    onInit() {
        this.show();
    }
    
    /* override */ 
    onVisible() {

    }
    
    /* override */ 
    onSelected() {
        if (this.seller.visible) {
            this.seller.show();
        }
    }

    /* override */ 
    onActiveTick(dt) {
        this.seller.activeTick(dt);
        if (this.seller.visible) {
            ui.setVisible(this.extra.parentElement);
        }

        for (const [_, btn] of Object.entries(this.do_buttons)) {
            btn.tick(dt);
        }

        if (this.make_buttons.house_upgrade) {
            const house_cost = HouseLevels.get(game.garden.level + 1, "cost");
            this.make_buttons.house_upgrade.setEnabled(game.inventory.hasEnough(house_cost));
        }

        for (const [_, btn] of Object.entries(this.make_buttons)) {
            btn.tick(dt);
        }
    }

    /* override */ 
    onPassiveTick(dt) {
        this.seller.passiveTick(dt);

        for (let i = 0; i < this.checks.length; ++i) {
            if (this.checks[i]()) {
                this.checks[i] = this.checks[this.checks.length - 1];
                this.checks.pop();
                --i;
            }
        }

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
    
    /* override */ 
    onExitSelected() {
        ui.setVisible(this.extra.parentElement, false);
    }
    
}