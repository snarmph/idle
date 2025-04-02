import { isElementVisible, lerp, makeVisible, makeInvisible } from "./script/utils.js"
import { addListener, removeListener, } from "./messages.js";
import { Resources, Items, MessageTypes } from "./enums.js";
import { Condition, ResourceCondition, glob } from "./glob.js";

const timeMult = .10;

export function make(data) {
    if (!("tag" in data)) data["tag"] = "div";
    if (!("attr" in data)) data["entries"] = {};
    if (!("children" in data)) data["children"] = [];

    let obj = document.createElement(data.tag);

    if ("content" in data) {
        obj.innerHTML = data.content;
    }

    if ("parent" in data) {
        if (typeof(data.parent) == "string") {
            const parent = document.getElementById(data.parent);
            parent.appendChild(obj);
        }
        else {
            data.parent.appendChild(obj);
        }
    }

    for (const [key, value] of Object.entries(data.attr)) {
        obj.setAttribute(key, value);
    }

    for (const child of data.children) {
        child["parent"] = obj;
        make(child);
    }

    return obj;
}

export class Button {
    constructor(id, parent, text, timeout_sec, onFinishedCallback) {
        this.id = id;
        this.start = 0;
        this.disabled = false;
        this.setTimeout(timeout_sec);
        this.button = make(
            {
                tag: "div",
                parent: parent,
                attr: {
                    id: id,
                    class: "button",
                },
            }
        );
        this.button_inner = make({
            tag: "div",
            parent: this.button,
            attr: {
                class: "button-inner",
            },
        })
        this.text = make({
            tag: "div",
            parent: this.button_inner,
            content: text,
            attr: {
                class: "item-text",
            }
        });
        this.cooldown = make(
            {
                tag: "div",
                parent: this.button_inner,
                attr: {
                    class: "cooldown",
                    style: "width: 0%",
                }
            }
        );
        this.onclicks = [];
        this.button.addEventListener("click", () => this.onClick());
        this.is_visible = true;

        this.onFinished = () => {
            onFinishedCallback();
        }
    }

    enable() {
        this.button.classList.remove("disabled");
        this.disabled = false;
        this.cooldown.setAttribute("style", "width: 0%");
    }

    setText(text) {
        this.text.textContent = text;
    }

    disable() {
        this.button.classList.add("disabled");
        this.disabled = true;
    }

    startCooldown() {
        this.disable();
        this.start = document.timeline.currentTime;
        requestAnimationFrame((t) => this.cooldownStep(t));
    }
    
    cooldownStep(timestamp) {
        const time = timestamp - this.start;
        const alpha = time / this.timeout;
        if (alpha >= 1.0) {
            this.finishCooldown();
            return;
        }
        const cur = lerp(100, 0, alpha);
        this.cooldown.setAttribute("style", `width: ${cur}%`)
        requestAnimationFrame((t) => this.cooldownStep(t));
    }

    finishCooldown() {
        this.enable();
        this.onFinished();
    }

    onClick() {
        if (!this.disabled) {
            for (const func of this.onclicks) {
                func();
            }
            this.startCooldown();
        }
    }

    setTimeout(seconds) {
        this.timeout = seconds * 1000.0 * timeMult;
    }

    setTooltip(text) {
        if (text == null) {
            this.button.removeAttribute("tooltip");
        }
        else {
            this.button.setAttribute("tooltip", text);
        }
    }

    addOnClick(func) {
        this.onclicks.push(func);
    }

    isVisible() {
        return isElementVisible(this.button);
    }

    setVisibility(is_visible) {
        if (is_visible) {
            makeVisible(this.button);
        }
        else {
            makeInvisible(this.button);
        }
    }
};

export class GetButton extends Button {
    constructor(id, text, timeout_sec, resource, step = 1) {
        super(id, "buttons", text, timeout_sec, () => {
            glob.inventory.addResource(this.resource, this.step);
        });
        this.resource = resource;
        this.step = step;
        this.updateTooltip();
    }

    updateTooltip() {
        this.setTooltip(`+${this.step} ${Resources.name(this.resource)}`);
    }
};

export class BuildButton extends Button {
    constructor(id, timeout_sec, item, resources, onBuilt) {
        super(id, "build", Items.name(item), timeout_sec, () => {
            onBuilt()
        });

        this.cost = null;
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

class InventoryItem {
    constructor(parent, id, css_id, name, is_numerable, quantity, total_quantity) {
        this.visible = total_quantity > 0;
        this.container = make(
            {
                parent: parent,
                attr: {
                    id: `${parent}-${css_id}`,
                    class: "inventory-item hidden",
                },
            }
        )
        this.name = make({
            content: name,
            parent: this.container,
            attr: {
                class: "item-name"
            }
        })

        this.id = id;
        this.item_name = name;
        this.count = quantity;
        this.total = total_quantity;
        this.is_numerable = is_numerable;
        if (is_numerable) {
            this.quantity = make({
                content: String(quantity),
                parent: this.container,
                attr: {
                    class: "item-quantity"
                }
            })
        }
    }

    set(count) {
        if (this.is_numerable) {
            this.quantity.textContent = String(count);
        }
        this.count = count;
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

    setTooltip(text) {
        if (text == null) {
            this.container.removeAttribute("tooltip");
        }
        else {
            this.container.setAttribute("tooltip", text);
        }
    }

    setName(name) {
        this.name.textContent = name;
    }

    makeVisible() {
        if (this.visible) return;
        makeVisible(this.container);
    }
}

export class Resource extends InventoryItem {
    constructor(id, quantity, total_quantity) {
        super("resources", id, Resources.key(id), Resources.name(id), true, quantity, total_quantity);
    }
}

export class Item extends InventoryItem {
    constructor(id, quantity, total_quantity, upgrade) {
        const item = Items.fromIndex(id);
        const cur_upgrade = Item.getUpgrade(id, upgrade);
        const name = cur_upgrade !== null ? cur_upgrade.name : item.name;

        super(
            "items", 
            id, 
            Items.key(id), 
            name, 
            Items.get(id, "numerable", true), 
            quantity, 
            total_quantity
        );
        
        this.upgrade = upgrade;
        this.item = Items.fromIndex(id);
        this.build_button = new BuildButton(`build-${Items.key(id)}`, 0.0, this.id, null, () => this.buy());
        this.build_button.addOnClick(() => {
            for (const [k, v] of Object.entries(this.next_upgrade.cost)) {
                glob.inventory.removeResource(k, v);
            }
        })

        this.updateUpgrade();
    }

    updateUpgrade() {
        this.build_button.setVisibility(false);
        const next = this.upgrade + 1;
        this.next_upgrade = Item.getUpgrade(this.id, next);
        if (this.next_upgrade === null) return;
        this.show_condition = new ResourceCondition(
            this.next_upgrade.show, 
            () => this.showUpgradeButton(this.next_upgrade),
            true
        );
        this.cost_condition = new ResourceCondition(
            this.next_upgrade.cost, 
            () => {
                this.build_button.enable();
                this.cost_condition.reset();
            }
        );

        this.listener_id = addListener((msg) => {
            if (msg !== MessageTypes.resourceUpdate) return;
            this.conditionsStep();
        });

        this.conditionsStep();
    }

    conditionsStep() {
        if (!this.build_button.isVisible()) {
            this.show_condition.step();
        }
        // condition might have changed this value 
        if (this.build_button.isVisible()) {
            if (!this.cost_condition.step()) {
                this.build_button.disable();
            }
        }
    }

    getNextUpgradeCost() {
        const next = this.upgrade + 1;
        const upgrades = Items.fromIndex(this.id).upgrades;
        if (next >= upgrades.length) {
            return null;
        }
        return upgrades[next].cost;
    }

    showUpgradeButton(upgrade) {
        this.build_button.setTimeout(upgrade.time);
        this.build_button.setCost(upgrade.cost);
        this.build_button.setText(upgrade.name);
        this.build_button.updateTooltip();
        this.build_button.disable();
        this.build_button.setVisibility(true);
    }

    buy() {
        this.upgrade += 1;
        this.setName(this.next_upgrade.name); 
        glob.inventory.addItem(this.id, 1);
        this.build_button.disable();
        removeListener(this.listener_id);
        this.updateUpgrade();
    }

    static getUpgrade(id, upgrade) {
        const upgrades = Items.fromIndex(id).upgrades;
        if (upgrade >= 0 && upgrade < upgrades.length) {
            return upgrades[upgrade];
        }
        else {
            return null;
        }
    }
}