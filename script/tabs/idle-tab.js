import { BaseTab } from "tabs/base-tab.js";
import { make, Category, Button, tab_manager } from "script/ui.js"
import { addListener, sendMessage } from "script/messages.js";
import { MessageTypes, Resources, Items, Colours } from "script/enums.js"
import { Item } from "script/inventory.js"
import { game } from "script/game.js"
import { valueString, getResourceName, getRandomInt, randomCheckPercent, makeInvisible, makeVisible, forEachCond, randomResources, formatNumber } from "script/utils.js"
import { ResourceCondition } from "script/condition.js";
import { Minion, MinionType } from "script/minion.js";
import * as actions from "script/actions.js"

let merchant = null;

export class BuildItemButton extends Button {
    constructor(id, parent, cooldown, item, onBuilt) {
        super(id, parent, Items.name(item), cooldown, () => {
            onBuilt();
        });
        this.cost = null;
        this.addOnClick(() => {
            for (const [id, count] of Object.entries(this.cost)) {
                game.inventory.removeResource(id, count);
            }
        })
    }

    setCost(cost) {
        this.cost = cost;
    }

    updateTooltip() {
        if (this.cost === null) {
            return;
        }
        let tooltip = [];

        const res = Object.entries(this.cost);
        for (let i = 0; i < res.length; ++i) {
            const count = res[i][1];
            const id = res[i][0];
            tooltip.push(valueString(id, count));
        }
        
        this.setTooltip(tooltip);
    }
}

class SellButton extends Button {
    constructor(resource, count, parent) {
        let name = "Sell ";
        if (count === 1) name += "a ";
        else name += `${count} `;
        name += getResourceName(resource, count);

        super(
            `sell-button-${Resources.key(resource)}`, 
            parent, 
            name, 
            0., 
            () => {
                this.checkCondition();
            }
        ),

        this.value = Resources.get(resource, "value", 0);
        this.setTooltip([
            valueString(resource, count),
            valueString(Resources.money, this.value *count),
        ]);
        
        this.cooldown.remove();
        this.addOnClick(() => {
            game.inventory.sellResource(resource, count);
            this.disable();
        });
        this.sell_cond = new ResourceCondition({ [resource]: count });
        addListener((msg, p) => {
            if (msg === MessageTypes.resourceUpdate) {
                this.checkCondition();
            }
        })
    }

    checkCondition() {
        let unlocked = this.sell_cond.step();
        this.sell_cond.reset();
        if (unlocked) {
            this.enable();
        }
        else {
            this.disable();
        }
    }
}

class BuyButton extends Button {
    constructor(resource, count, parent) {
        let name = "Buy ";
        if (count === 1) name += "a ";
        else name += `${count} `;
        name += getResourceName(resource, count);

        super(
            `buy-button-${Resources.key(resource)}`, 
            parent, 
            name, 
            0., 
            () => {
                this.checkCondition();
            }
        ),

        this.value = Resources.get(resource, "value", 0);
        this.setTooltip([
            valueString(Resources.money, this.value * count),
            valueString(resource, count),
        ]);
        
        this.cooldown.remove();
        this.addOnClick(() => {
            game.inventory.buyResource(resource, count);
            this.disable();
        });
        this.buy_cond = new ResourceCondition({ [Resources.money]: this.value * count });
        addListener((msg, p) => {
            if (msg === MessageTypes.resourceUpdate) {
                this.checkCondition();
            }
        })
    }

    checkCondition() {
        let unlocked = this.buy_cond.step();
        this.buy_cond.reset();
        if (unlocked) {
            this.enable();
        }
        else {
            this.disable();
        }
    }
}

class BuyMinion extends Button {
    constructor(type, count, parent) {
        const minion = MinionType.fromIndex(type);
        console.log(MinionType, minion);
        let name = "Buy ";
        if (count === 1) name += "a ";
        else name += `${count} `;
        name += minion.name;

        super(
            `buy-button-${MinionType.key(type)}`, 
            parent, 
            name, 
            0., 
            () => {
                this.checkCondition();
            }
        ),

        this.value = minion.value;
        this.setTooltip([
            valueString(Resources.money, -this.value * count),
            `+${count} ${minion.name}`
        ]);
        
        this.cooldown.remove();
        this.addOnClick(() => {
            game.inventory.removeResource(Resources.money, this.value * count);
            game.village.add(type, count);
            this.disable();
        });
        this.buy_cond = new ResourceCondition({ [Resources.money]: this.value * count });
        addListener((msg, p) => {
            if (msg === MessageTypes.resourceUpdate) {
                this.checkCondition();
            }
        })
    }

    checkCondition() {
        let unlocked = this.buy_cond.step();
        this.buy_cond.reset();
        if (unlocked) {
            this.enable();
        }
        else {
            this.disable();
        }
    }
}

export class IdleTab extends BaseTab {
    constructor() {
        super("idle", "Forest");

        this.grid_element    = make({ attr: { class: "idle-grid" },          parent: this.content_element, });
        this.get_element     = make({ attr: { class: "idle-get-buttons" },   parent: this.grid_element, });
        this.build_element   = make({ attr: { class: "idle-build-buttons" }, parent: this.grid_element, });
        this.data_element    = make({ attr: { class: "idle-data" },          parent: this.grid_element, });

        this.extra = document.getElementById("extra");
        
        this.resources_category = new Category("idle-resources", this.data_element, "Resources");
        this.items_category     = new Category("idle-items",     this.data_element, "Items");

        this.seller_category  = new Category("idle-seller", this.grid_element, "Seller");

        makeInvisible(this.resources_category.element);
        makeInvisible(this.items_category.element);
        makeInvisible(this.seller_category.element);
        this.resources = {};
        this.items = {};

        this.unbuilt_items = [];

        for (const [id, _] of Items.each()) {
            const item = game.inventory.addItem(id, 0, 0, 0);
            this.unbuilt_items.push(item);
        }

        this.explore_forest = new Button("button-explore", this.get_element, "Explore Wilderness", .3, () => {
            const found = actions.exploreForest();
    
            let msg = `Found ${found.wood} branch`;
            if (found.wood > 1) msg += "es";
            
            const items = found.getResults().slice(1);
            for (let i = 0; i < items.length - 1; ++i) {
                if (!items[i]) continue;
                msg += `, a ${items[i].name}`; 
            }
            if (items.length > 1) {
                msg += ` and a ${items[items.length - 1].name}`; 
            }

            game.log(msg);
        });

        this.buy_button = null;
        this.sell_buttons = [];

        this.merchant_timer = null;
        this.merchant_visible = false;

        this.conditions = [
            new ResourceCondition(
                { [Resources.wheat]: 20, },
                () => {
                    if (tab_manager.active.id === this.tab_id) {
                        this.showMerchant();
                    }
                    this.merchant_visible = true;
                    this.buy_button = new SellButton(Resources.wheat, 5, this.seller_category.element);
                    game.log("A merchant has appeared", Colours.yellow);
                    sendMessage(MessageTypes.eventUpdate);
                }
            ),
            new ResourceCondition(
                { [Resources.money]: 10 },
                () => {
                    this.sell_buttons.push(new BuyMinion(MinionType.base, 1, this.seller_category.element));
                }
            )
        ];

        addListener((msg, payload) => {
            if (msg == MessageTypes.resourceUpdate) {
                this.addResource(payload);
                forEachCond(this.conditions);
            }
            else if (msg == MessageTypes.itemUpdate) {
                this.addItem(payload);
            }
            for (const item of this.unbuilt_items) {
                if (item.isVisible()) {
                    this.updateItem(item);
                }
            }
        })
    }
    
    /* override */
    onSelected() {
        if (this.merchant_visible) {
            this.showMerchant();
        }
    }

    /* override */ 
    onExitSelected() {
        if (this.merchant_visible) {
            clearTimeout(this.merchant_timer);
            this.merchant_timer = null;
            makeInvisible(this.extra.parentElement);
        }
    }

    addResource(data) {
        if (data.id in this.resources) {
            this.resources[data.id].quantity.textContent = formatNumber(data.count);
        }
        else {
            let container = make(
                {
                    parent: this.resources_category.element,
                    attr: {
                        id: `resource-${data.id}`,
                        class: "idle-item",
                    }
                }
            );
            let name = make(
                {
                    parent: container,
                    content: Resources.name(data.id),
                    attr: {
                        class: "item-name",
                    },
                }
            );
            let quantity = make(
                {
                    content: formatNumber(data.count),
                    parent: container,
                    attr: {
                        class: "item-quantity",
                    },
                }
            );
            this.resources[data.id] = {
                container: container,
                name: name,
                quantity: quantity,
            };
            makeVisible(this.resources_category.element);   
        }
    }

    updateItem(item) {
        const cur_upgrade = item.getUpgrade();
        let build_btn = null;

        // item cannot be upgraded anymore, delete it's button
        if (cur_upgrade === null) {
            this.itemFinishedBuilding(item);
            return;
        }

        if (item.id in this.items) {
            build_btn = this.items[item.id].build_btn;
        }
        else {
            build_btn = new BuildItemButton(
                `build-${Items.key(item.id)}`, 
                this.build_element, 
                cur_upgrade.time, 
                item.id, 
                () => game.inventory.buyItem(item.id)
            );
    
            let container = make(
                {
                    parent: this.items_category.element,
                    attr: {
                        id: `item-${item.id}`,
                        class: "idle-item hidden",
                    }
                }
            );
            let name = make(
                {
                    parent: container,
                    content: cur_upgrade.name,
                    attr: {
                        class: "item-name",
                    },
                }
            );
    
            this.items[item.id] = {
                build_btn: build_btn,
                container: container,
                name: name,
            };
        }

        build_btn.setText(cur_upgrade.name);
        build_btn.setTimeout(cur_upgrade.time);
        build_btn.setCost(cur_upgrade.cost);
        build_btn.updateTooltip();
        if (item.isBuildable()) {
            build_btn.enable();
        }
        else {
            build_btn.disable();
        }
        build_btn.setVisibility(true);
    }

    itemFinishedBuilding(item) {
        this.items[item.id].build_btn.button.remove();
        this.items[item.id].build_btn = null;

        for (let i = 0; i < this.unbuilt_items.length; ++i) {
            if (this.unbuilt_items[i] == item) {
                this.unbuilt_items[i] = this.unbuilt_items[this.unbuilt_items.length - 1];
                this.unbuilt_items.pop();
                return;
            }
        }
    }

    addItem(data) {
        const inv_item = game.inventory.getItem(data.id);

        const cur_upgrade = inv_item.getUpgrade(inv_item.upgrade - 1);
        const item = this.items[data.id];
        this.updateItem(inv_item);
        if (item.build_btn) {
            item.build_btn.setVisibility(false);
        }

        if (inv_item.visible && cur_upgrade !== null) {
            item.name.textContent = cur_upgrade.name;
            makeVisible(this.items_category.element);
            makeVisible(item.container);
        }
    }

    isMerchantVisible() {
        return this.merchant_visible;
    }

    showMerchant() {
        makeVisible(this.extra.parentElement);
        makeVisible(this.seller_category.element);
        this.animateMerchant();
    }

    animateMerchant() {
        this.extra.textContent = merchant[0];
        const timeout = getRandomInt(5000, 10000);
        clearTimeout(this.merchant_timer);
        this.merchant_timer = setTimeout(
            () => {
                clearTimeout(this.merchant_timer);
                this.extra.textContent = merchant[1];
                this.merchant_timer = setTimeout(
                    () => {
                        this.animateMerchant();
                    },
                    100
                );
            },
            timeout,
        );
    }
}

merchant = [
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