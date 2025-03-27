import { Item, Resource } from "./ui.js";
import { makeVisible, isElementVisible } from "./utils.js";
import { Resources, Items, Npcs, MessageTypes } from "./enums.js";
import { sendMessage } from "./messages.js";

export let glob = {
    game: null,
    inventory: null,
    village: null,
};

export class SaveData {
    constructor() {
        this.init();
    }

    hasSaveData() {
        return "save-data" in localStorage;
    }

    reset() {
        localStorage.clear();
    }

    init() {
        this.reset();

        if (this.hasSaveData()) {
            this.load();
            return;
        }

        for (const [k, _] of Resources.each()) {
            glob.inventory.addResource(k, 0, 0);
        }

        for (const [k, _] of Items.each()) {
            glob.inventory.addItem(k, 0, 0, -1);
        }

    }

    load() {
        const save_data = JSON.parse(localStorage.getItem("save-data"));

        for (const k of save_data.resources) {
            glob.inventory.addResource(k.id, k.visible, k.quantity, k.total);
        }

        for (const k of save_data.items) {
            glob.inventory.addItem(k.id, k.visible, k.quantity, k.total);
        }
    }

    save() {
        /*
        let save_data = {
            timestamp: document.timeline.currentTime,
            resources: [],
            items: [],
        };

        for (const [k, _] of Resources.each()) {
            const item = glob.inventory.resources[k];
            save_data.resources.push({
                id: k,
                quantity: item.get(),
                total: item.getTotal(),
                visible: isElementVisible(item.container),
            });
        }

        for (const [k, _] of Items.each()) {
            const item = glob.inventory.items[k];
            save_data.items.push({
                id: k,
                quantity: item.get(),
                total: item.getTotal(),
                visible: isElementVisible(item.container),
            });
        }

        localStorage.setItem("save-data", JSON.stringify(save_data));
        */
    }
}

export class Condition {
    constructor(condition, consequence = null) {
        this.condition = condition;
        this.consequence = consequence;
        this.is_unlocked = false;
    }

    step() {
        if (!this.is_unlocked && this.condition()) {
            this.is_unlocked = true;
            if (this.consequence !== null) {
                this.consequence();
            }
            return true;
        }
        return false;
    }

    unlocked() {
        return this.is_unlocked;
    }

    reset() {
        this.is_unlocked = false;
    }
}

export class ResourceCondition extends Condition {
    constructor(resources, onUnlocked = null, checkTotal = false) {
        super(
            () => {
                for (const [k, v] of Object.entries(resources)) {
                    const res = glob.inventory.getResource(k);
                    if (checkTotal) {
                        if (res.getTotal() < v) {
                            console.log(res.name.textContent, v, res.getTotal());
                            return false;
                        }
                    }
                    else if (res.get() < v) {
                        return false;
                    }
                }
                return true;
            },
            onUnlocked
        );
    }
}

export class ItemCondition extends Condition {
    constructor(items, onUnlocked = null) {
        super(
            () => {
                for (const [k, v] of Object.entries(items)) {
                    if (glob.inventory.getItem(k).upgrade < v) {
                        return false;
                    }
                    return true;
                }
            },
            onUnlocked
        );
    }
}

export class Inventory {
    constructor() {
        this.resources_elem = document.getElementById("resources");
        this.items_elem = document.getElementById("items");
        this.resources = {};
        this.items = {};
    }

    addResource(id, count, total = 0) {
        const res = Resources.fromIndex(id);
        if (id in this.resources) {
            if (count == 0) {
                return;
            }
            makeVisible(this.resources_elem);
            this.resources[id].makeVisible();
            this.resources[id].add(count);
        }
        else {
            this.resources[id] = new Resource(id, count, total);
        }
        sendMessage(MessageTypes.resourceUpdate);
    }

    removeResource(id, n) {
        this.resources[id].remove(n);
        sendMessage(MessageTypes.resourceUpdate);
    }

    getResource(id) {
        return this.resources[id];
    }

    addItem(id, count, total = 0, upgrade = -1) {
        if (id in this.items) {
            if (count == 0) {
                return;
            }
            makeVisible(this.items_elem);
            this.items[id].makeVisible();
            this.items[id].add(count);
        }
        else {
            this.items[id] = new Item(id, count, total, upgrade);
        }
        sendMessage(MessageTypes.itemUpdate);
    }

    removeItem(id, count) {
        this.items[id].remove(count);
        sendMessage(MessageTypes.itemUpdate);
    }

    getItem(id) {
        return this.items[id];
    }
}

export class Village {
    constructor() {
        this.villagers = {};
        this.element = document.getElementById("npcs");
    }

    addVillager(id) {

        const npc = Npcs.fromIndex(id);
        if (id in this.villagers) {
            makeVisible(this.element);
            this.villagers[id].count += 1;
        }
        else {
            this.villagers[id] = {
                count: 0,
            };
            for (const action of npc.actions) {
                setInterval(() => this.updateAction(id, action), action.timer * 1000.0);
            }
        }

        for (const action of npc.actions) {
            glob.inventory.resources[action.resource].setTooltip(`${npc.name} +${action.count * this.villagers[id].count} per ${action.timer}s`);
        }
    }

    remVillager(id) {
        if (id in this.villagers && this.villagers[id].count > 0) {
            this.villagers[id].count -= 1;
        }
    }

    updateAction(id, action) {
        glob.inventory.addResource(action.resource, action.count * this.villagers[id].count);
    }
}