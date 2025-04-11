import * as ui from "src/ui/base.js"
import * as num from "src/utils/num.js"
import { game } from "src/game.js"
import { PinpinType } from "src/village.js";
import { Resources } from "src/inventory.js";

export class Button {
    constructor(id, parent, text, onClickCb = null) {
        this.id = id;
        this.disabled = false;
        this.is_visible = true;
        this.onclicks = [];
        if (onClickCb) this.onclicks.push(onClickCb);

        this.element = ui.htmlFromStr(
            `<div id="${id}" class="button"></div>`,
            parent
        );
        this.inner_elem = ui.htmlFromStr(
            `<div class="button-inner"></div>`,
            this.element
        );
        this.text_elem = ui.htmlFromStr(
            `<div class="button-text">${text}</div>`,
            this.inner_elem
        );
        this.element.addEventListener("click", () => this.onClick());
    }

    setEnabled(is_enabled = true) {
        if (is_enabled) {
            this.enable();
        }
        else {
            this.disable();
        }
    }

    enable() {
        this.element.classList.remove("button-disabled");
        this.disabled = false;
    }

    disable() {
        this.element.classList.add("button-disabled");
        this.disabled = true;
    }

    isEnabled() {
        return !this.disabled;
    }

    setText(text) {
        this.text_elem.textContent = text;
    }

    setContent(content) {
        this.text_elem.innerHTML = content;
    }

    getText() {
        this.text_elem.textContent;
    }

    setTooltip(text) {
        if (text === null) {
            this.element.removeAttribute("tooltip");
        }
        else {
            this.element.setAttribute("tooltip", text);
        }
    }

    setTooltipFromArr(arr) {
        let text = null;
        if (arr && arr.length > 0) {
            text = "";
            for (const it of arr) {
                text += it + "\n";
            }
        }
        this.setTooltip(text);
    }

    addOnClick(func) {
        this.onclicks.push(func);
    }

    isVisible() {
        return ui.isVisible(this.element);
    }

    setVisible(is_visible = true) {
        ui.setVisible(this.element, is_visible);
    }

    onClick() {
        if (!this.disabled) {
            for (const func of this.onclicks) {
                func();
            }
        }
    }
}

export class CooldownButton extends Button {
    constructor(id, parent, text, cooldown, onFinishedCb, onClickCb = null) {
        super(id, parent, text, onClickCb);

        this.is_in_cooldown = false;
        this.timeout = cooldown * 1000;
        this.cur_time = 0;
        this.cooldown = ui.htmlFromStr(
            `<div class="button-cooldown" style="width: 0%"></div>`,
            this.inner_elem
        );
        this.callback = onFinishedCb;

        this.onclicks.push(() => this.startCooldown());
    }

    setCooldown(cooldown) {
        this.timeout = cooldown;
    }

    enable() {
        if (this.is_in_cooldown) return;
        super.enable();
    }

    startCooldown() {
        this.disable();
        this.cur_time = 0;
        this.is_in_cooldown = true;
    }

    endCooldown() {
        this.is_in_cooldown = false;
        this.cooldown.removeAttribute("style");
        this.enable();
        if (this.callback) {
            this.callback();
        }
    }

    logicTick(dt) {
        if (!this.is_in_cooldown) return;

        this.cur_time += dt;
        if (this.cur_time >= this.timeout) {
            this.endCooldown();
            return;
        }
    }

    renderTick(dt) {
        if (!this.is_in_cooldown) return;

        const alpha = this.cur_time / this.timeout;
        this.setCooldownBarWidth(alpha);
    }

    setCooldownBarWidth(alpha) {
        const width = num.lerp(100, 0, alpha);
        this.cooldown.setAttribute("style", `width: ${width}%`);
    }
}

export class BuyPinpinButton extends Button {
    constructor(type, count, resources, parent) {
        const pinpin = PinpinType.fromIndex(type);
        const pin_name = pinpin.name;

        let text = "Barter for ";
        if (count === 1) text += "a";
        else text += num.format(count);
        text += ` ${pinpin.name}`;

        super(
            `buy-pinpin-button-${PinpinType.key(type)}`,
            parent,
            text,
            () => {
                game.inventory.removeMultiple(this.cost);
                game.village.add(type, count);
            }
        );

        this.cost = resources;
        
        let tip = `+${num.format(count)} ${pinpin.name}`;
        for (const [id, count] of Object.entries(resources)) {
            tip += `\n-${num.format(count)} ${Resources.name(id)}`;
        }
        this.setTooltip(tip)
    }

    renderTick(dt) {
        this.setEnabled(game.inventory.hasEnough(this.cost));
    }
}