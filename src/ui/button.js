import { htmlFromStr } from "src/ui/base.js"
import { lerp, formatResource } from "src/utils/num.js"
import { ResourceCondition } from "src/condition.js"
import { MessageTypes, addListener } from "src/messages.js"
import { Resources } from "src/inventory.js"
import { game } from "src/game.js"
import { PinpinType } from "../village.js"
import { formatNumber } from "../utils/num.js"

export class SimpleButton {
    constructor(id, parent, text, onClickCallback = null) {
        this.id = id;
        this.disabled = false;
        this.button = htmlFromStr(
            `<div id="${id}" class="button simple-button"></div>`,
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
        this.onclicks = [];
        this.button.addEventListener("click", () => this.onClick());
        this.is_visible = true;

        if (onClickCallback) {
            this.onclicks.push(onClickCallback);
        }
    }

    enable() {
        this.button.classList.remove("button-disabled");
        this.disabled = false;
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

    onClick() {
        if (!this.disabled) {
            for (const func of this.onclicks) {
                func();
            }
        }
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
}

export class Button extends SimpleButton {
    constructor(id, parent, text, timeout_sec, onFinishedCallback) {
        super(id, parent, text);
        
        this.start = 0;
        this.is_in_cooldown = false;
        this.setTimeout(timeout_sec);
        this.cooldown = htmlFromStr(
            `<div class="button-cooldown" style="width: 0%"></div>`,
            this.button_inner
        );

        this.onFinished = () => {
            onFinishedCallback();
        }

        this.onclicks.push(() => this.startCooldown());
    }

    enable() {
        if (this.is_in_cooldown) return;
        super.enable();
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

    setTimeout(seconds) {
        this.timeout = seconds * 1000.0;
    }
};

export class ExchangeResButton extends SimpleButton {
    constructor(get_res, get_count, give_res, give_count, parent) {
        let text = `Barter for ${get_count} ${Resources.name(get_res)}`;

        super(
            `exchange-button-${Resources.key(get_res)}`,
            parent,
            text,
            () => {
                game.inventory.remove(this.give_res, this.give_count);
                game.inventory.add(this.get_res, this.get_count);
                this.disable();
                this.checkCondition()
            }
        );

        this.get_res = get_res;
        this.get_count = get_count;
        this.give_res = give_res;
        this.give_count = give_count;

        this.condition = new ResourceCondition({ [this.give_res]: this.give_count });
        addListener(MessageTypes.resourceUpdate, () => this.checkCondition());
        this.update();
    }

    update() {
        this.setTooltip([
            formatResource(this.give_res, -this.give_count),
            formatResource(this.get_res, this.get_count),
        ]);
    }

    checkCondition() {
        console.log(this.condition);
        if (this.condition.step()) {
            this.condition.reset();
            this.enable();
        }
        else {
            this.disable();
        }
    }
}

export class SellButton extends ExchangeResButton {
    constructor(resource, count, parent) {
        const value = Resources.get(resource, "value", 0);
        super(
            Resources.money, value * count, 
            resource, count,
            parent
        );

        this.value = value;
        this.value_multiplier = 1;
        this.updateText();
    }

    setSellCount(count) {
        this.give_count = count;
        this.get_count = (this.value * this.value_multiplier) * count;
        this.updateText();
        this.update();
    }

    setValueMultiplier(mul) {
        this.value_multiplier = mul;
        this.get_count = (this.value * this.value_multiplier) * this.give_count;
        this.updateText();
        this.update();
    }

    updateText() {
        let text = "Sell ";
        if (this.give_count === 1) text += "a";
        else text += this.give_count;
        text += ` ${Resources.name(this.give_res)}`;

        this.setText(text)
    }
}

export class BuyButton extends ExchangeResButton {
    constructor(resource, count, parent) {
        const value = Resources.get(resource, "value", 0);
        super(
            resource, count,
            Resources.money, value * count, 
            parent
        );

        const res_name = Resources.name(resource);

        let text = "Buy ";
        if (count === 1) text += "a";
        else text += count;
        text += ` ${res_name}`;

        this.setText(text)
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
            formatResource(Resources.money, -this.cost),
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