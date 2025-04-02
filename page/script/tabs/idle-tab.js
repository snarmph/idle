import { BaseTab } from "./base-tab.js";
import { make, Category, Button } from "script/ui.js"
import { addListener } from "script/messages.js";
import { MessageTypes, Resources, Items } from "script/enums.js"
import { Item } from "script/inventory.js"
import { game } from "script/game.js"
import { getRandomInt, randomCheckPercent, makeInvisible, makeVisible, forEachCond, randomResources } from "script/utils.js"
import { ResourceCondition } from "script/condition.js";

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
        let tooltip = "";

        const res = Object.entries(this.cost);
        for (let i = 0; i < res.length; ++i) {
            if (i > 0) {
                tooltip += "\n";
            }
            tooltip += `-${res[i][1]} ${Resources.name(res[i][0])}`;
        }
        
        this.setTooltip(tooltip);
    }
}

export class IdleTab extends BaseTab {
    constructor() {
        super("idle", "Forest");

        this.grid_element    = make({ attr: { class: "idle-grid" },          parent: this.content_element, });
        this.get_element     = make({ attr: { class: "idle-get-buttons" },   parent: this.grid_element, });
        this.build_element   = make({ attr: { class: "idle-build-buttons" }, parent: this.grid_element, });
        this.data_element    = make({ attr: { class: "idle-data" },   parent: this.grid_element, });
        
        this.resources_category = new Category("idle-resources", this.data_element, "Resources");
        this.items_category     = new Category("idle-items",     this.data_element, "Items");
        makeInvisible(this.resources_category.element);
        makeInvisible(this.items_category.element);
        this.resources = {};
        this.items = {};

        this.unbuilt_items = [];

        for (const [id, _] of Items.each()) {
            const item = game.inventory.addItem(id, 0, 0, 0);
            this.unbuilt_items.push(item);
        }

        this.explore_forest = new Button("button-explore", this.get_element, "Explore Wilderness", .3, () => {
            const found = randomResources({
                [Resources.wood]: { min: 1, max: 5 },
                [Resources.seeds]: { atleast: 90 },
                [Resources.stone]: { atleast: 98 }
            });

            let msg = `Found ${found.wood} branch`;
            if (found.wood > 1) msg += "es";
            game.inventory.addResource(Resources.wood, found.wood);
            
            const items = found.getResults().slice(1);
            const add_item = (obj, prefix) => {
                if (!obj) return;
                msg += prefix + obj.name;
                game.inventory.addResource(obj.id, obj.count);
            }
            for (let i = 0; i < items.length - 1; ++i) {
                add_item(items[i], ", a ");
            }
            add_item(items[items.length - 1], " and a ");

            game.log(msg);
        });

        addListener((msg, payload) => {
            if (msg == MessageTypes.resourceUpdate) {
                this.addResource(payload);
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

    addResource(data) {
        if (data.id in this.resources) {
            this.resources[data.id].quantity.textContent = String(data.count);
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
                    content: String(data.count),
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
}