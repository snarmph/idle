import { make, Category, Button, tab_manager } from "script/ui.js";
import { Resources, Items, MessageTypes } from "script/enums.js"
import { game } from "script/game.js"
import { sendMessage, addListener, removeListener  } from "script/messages.js"
import { ResourceCondition, ItemCondition } from "script/condition.js"
import { makeVisible, getRandomInt } from "script/utils.js";

class InventoryItem {
    constructor(id, message_type, quantity, total_quantity, is_numerable) {
        this.message_type = message_type;

        this.id = id;
        this.count = quantity;
        this.total = total_quantity;
        this.is_numerable = is_numerable;
    }

    set(count) {
        this.count = count;
        sendMessage(this.message_type, { id: this.id, count: this.count });
    }

    get() {
        if (this.is_numerable) {
            return this.count;
        }
        else {
            return Number(this.count > 0);
        }
    }

    getTotal() {
        return this.total;
    }

    add(n) {
        if (this.is_numerable) {
            this.total += n;
            this.set(this.get() + n);
        }
        else {
            this.total = 1;
            this.set(1);
        }
    }

    remove(n) {
        if (this.is_numerable) {
            const q = this.get() - n;
            if (q < 0) alert("q is less than 0!");
            this.set(q);
        }
        else {
            this.set(0);
        }
    }
}

export class Resource extends InventoryItem {
    constructor(id, quantity, total_quantity) {
        super(
            id, 
            MessageTypes.resourceUpdate,
            quantity,
            total_quantity,
            true
        );
    }
}

export class Item extends InventoryItem {
    constructor(id, quantity, total_quantity, upgrade) {
        super(
            id, 
            MessageTypes.itemUpdate, 
            quantity, 
            total_quantity,
            Items.get(id, "numerable", true)
        );

        this.data = Items.fromIndex(id);
        this.upgrade = upgrade;
        this.visible = Items.get(id, "visible", true);
        this.show_cost = null;
        this.build_cost = null;
        

        this.updateCost();
    }

    updateCost() {
        this.build_cost = null;
        this.show_cost = null;

        const cur_upgrade = this.getUpgrade();
        if (cur_upgrade === null) return;
        this.build_cost = cur_upgrade.cost;
        this.show_cost  = cur_upgrade.show;
    }

    isVisible() {
        return this._checkCostCondition(this.show_cost, true);
    }

    isBuildable() {
        return this._checkCostCondition(this.build_cost, false);
    }

    _checkCostCondition(cost, checkTotal) {
        if (cost === null) return false;

        for (const [k, v] of Object.entries(cost)) {
            const res = game.inventory.getResource(k);
            if (res === null) {
                return false;
            }

            if (checkTotal) {
                if (res.getTotal() < v) {
                    return false;
                }
            }
            else if (res.get() < v) {
                return false;
            }
        }
        return true;
    }

    getNextUpgradeCost() {
        const next = this.upgrade + 1;
        const upgrades = Items.fromIndex(this.id).upgrades;
        if (next >= upgrades.length) {
            return null;
        }
        return upgrades[next].cost;
    }

    getUpgrade(upgrade = this.upgrade) {
        if (this.data.upgrades.length <= upgrade) {
            return null;
        }
        return this.data.upgrades[upgrade];
    }
}

export class Inventory {
    constructor() {
        this.resources = {};
        this.items = {};
    }

    init() {
    }

    addResource(id, count, total = count) {
        if (id in this.resources) {
            if (count == 0) {
                return;
            }
            this.resources[id].add(count);
        }
        else {
            this.resources[id] = new Resource(id, count, total);
            this.resources[id].total_quantity = total;
            this.resources[id].set(count);
        }
    }

    removeResource(id, count) {
        this.resources[id].remove(count);
    }

    getResource(id) {
        return id in this.resources ? this.resources[id] : null;
    }

    addItem(id, count, total = count, upgrade = -1) {
        if (id in this.items) {
            if (count == 0) {
                return;
            }
            this.items[id].add(count);
        }
        else {
            this.items[id] = new Item(id, count, total, upgrade);
            this.items[id].total_quantity = total;
            this.items[id].set(count);
        }

        return this.items[id];
    }

    buyItem(id, count = 1) {
        if (!(id in this.items)) {
            this.addItem(id, count, count, 0);
            return;
        }
        
        const item = this.items[id];
        item.upgrade += 1;
        item.updateCost();
        item.add(count);
    }

    removeItem(id, count) {
        this.items[id].remove(count);
        sendMessage(MessageTypes.itemUpdate, { id: id, count: -count });
    }

    getItem(id) {
        return this.items[id];
    }
}