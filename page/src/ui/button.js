import { htmlFromStr } from "src/ui/base.js"
import { lerp, formatResource } from "src/utils/num.js"
import { ResourceCondition } from "src/condition.js"
import { MessageTypes, addListener } from "src/messages.js"
import { Resources } from "src/inventory.js"
import { game } from "src/game.js"
import { PinpinType } from "../village.js"
import { formatNumber } from "../utils/num.js"

export class Button {
    constructor(id, parent, text, timeout_sec, onFinishedCallback) {
        this.id = id;
        this.start = 0;
        this.disabled = false;
        this.setTimeout(timeout_sec);
        this.button = htmlFromStr(
            `<div id="${id}" class="button"></div>`,
            parent
        );
        this.button_inner = htmlFromStr(
            `<div class="button-inner"></div>`,
            this.button
        );
        this.button_text = htmlFromStr(
            `<div class="button-text">${text}</div>`,
            this.button_inner
        );
        this.cooldown = htmlFromStr(
            `<div class="button-cooldown" style="width: 0%"></div>`,
            this.button_inner
        );
        this.onclicks = [];
        this.button.addEventListener("click", () => this.onClick());
        this.is_visible = true;
        this.is_in_cooldown = false;

        this.onFinished = () => {
            onFinishedCallback();
        }
    }

    enable() {
        if (this.is_in_cooldown) return;
        this.button.classList.remove("button-disabled");
        this.disabled = false;
        this.cooldown.setAttribute("style", "width: 0%");
    }

    setText(text) {
        this.button_text.textContent = text;
    }

    setButtonContent(content) {
        this.button_text.innerHTML = content;
    }

    disable() {
        this.button.classList.add("button-disabled");
        this.disabled = true;
    }

    isEnabled() {
        return !this.disabled;
    }

    startCooldown() {
        this.disable();
        this.start = document.timeline.currentTime;
        this.is_in_cooldown = true;
        requestAnimationFrame((t) => this.cooldownStep(t));
    }
    
    cooldownStep(timestamp) {
        const time = timestamp - this.start;
        const alpha = time / this.timeout;
        if (alpha >= 1.0) {
            this.finishCooldown();
            return;
        }
        this.setCooldownBarWidth(alpha);
        requestAnimationFrame((t) => this.cooldownStep(t));
    }

    setCooldownBarWidth(alpha) {
        const width = lerp(100, 0, alpha);
        this.cooldown.setAttribute("style", `width: ${width}%`);
    }

    finishCooldown() {
        this.is_in_cooldown = false;
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
        this.timeout = seconds * 1000.0;
    }

    setTooltipText(text) {
        this.button.setAttribute("tooltip", text);
    }

    setTooltip(values) {
        if (values === null || values.length === 0) {
            this.button.removeAttribute("tooltip");
        }
        else {
            let text = "";
            for (const v of values) {
                text += `${v}\n`;
            }
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

    click() {
        if (!this.disabled) {
            this.button.click();
        }
    }
};

export class SellButton extends Button {
    constructor(resource, count, parent) {
        const res_name = Resources.name(resource);

        let name = "Sell ";
        if (count === 1) name += "a";
        else name += count;
        name += ` ${res_name}`;

        super(
            `sell-button-${Resources.key(resource)}`,
            parent,
            name,
            0.,
            () => {
                this.checkCondition()
            }
        );

        this.value = Resources.get(resource, "value", 0);
        this.setTooltip([
            formatResource(resource, count),
            formatResource(Resources.money, this.value * count),
        ]);

        this.cooldown.remove();
        this.addOnClick(() => {
            game.inventory.sell(resource, count);
            this.disable();
        });
        this.condition = new ResourceCondition({ [resource]: count });
        addListener(MessageTypes.resourceUpdate, () => this.checkCondition());
    }

    checkCondition() {
        if (this.condition.step()) {
            this.condition.reset();
            this.enable();
        }
        else {
            this.disable();
        }
    }
}


export class BuyPinpinButton extends Button {
    constructor(type, count, parent) {
        const pinpin = PinpinType.fromIndex(type);
        const pin_name = pinpin.name;

        let name = "Buy ";
        if (count === 1) name += "a";
        else name += count;
        name += ` ${pin_name}`;

        super(
            `buy-pinpin-button-${PinpinType.key(type)}`,
            parent,
            name,
            0.,
            () => {
                this.checkCondition()
            }
        );

        this.cost = pinpin.value * count;
        this.setTooltip([
            `+${formatNumber(count)} ${pinpin.name}`,
            formatResource(Resources.money, this.cost),
        ]);

        this.cooldown.remove();
        this.addOnClick(() => {
            game.inventory.remove(Resources.money, this.cost);
            game.village.add(type, count);
            this.disable();
        });
        this.condition = new ResourceCondition({ [Resources.money]: this.cost });
        addListener(MessageTypes.resourceUpdate, () => this.checkCondition());
    }

    checkCondition() {
        if (this.condition.step()) {
            this.condition.reset();
            this.enable();
        }
        else {
            this.disable();
        }
    }
}