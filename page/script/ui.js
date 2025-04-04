import { isElementVisible, lerp, makeVisible, makeInvisible } from "script/utils.js"
import { addListener, removeListener } from "script/messages.js"

export function make(data) {
    if (!("tag" in data)) data["tag"] = "div";
    if (!("attr" in data)) data["attr"] = {};
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

export class Tab {
    constructor(tab) {
        this.tab_element = make({
            content: tab.name,
            attr: {
                id: tab.tab_id,
                class: "tab-item",
            },
        });
        this.tab_content = make({
            attr: {
                class: "tab-content-item hidden",
            },
        });
        this.tab_content.appendChild(tab.content_element);
        this.id = tab.tab_id;
        this.object = tab;
    }

    setActive(active) {
        if (active) {
            this.tab_element.classList.add("tab-active");
            this.tab_content.classList.remove("hidden");
        }
        else {
            this.tab_element.classList.remove("tab-active");
            this.tab_content.classList.add("hidden");
        }
    }
}

export class TabManager {
    constructor() {
        this.header = document.getElementById("tab-header");
        this.content = document.getElementById("main-content");
        this.filler = document.getElementById("tab-filler");
        this.tabs = {};
        this.active = null;
        this.invisible_tabs = [];

        this.listener_id = addListener((msg, p) => {
            for (let i = 0; i < this.invisible_tabs.length; ++i) {
                const tab = this.invisible_tabs[i];
                if (tab.object.isVisible()) {
                    tab.object.onVisible();
                    tab.tab_element.classList.remove("hidden");
                    this.invisible_tabs[i] = this.invisible_tabs[this.invisible_tabs.length - 1];
                    this.invisible_tabs.pop();
                    --i;
                }
            }
            
            // if we showed all the tabs, remove this listener 
            // (also check for active so we now we finished initialising)
            if (this.invisible_tabs.length === 0 && this.active !== null) {
                removeListener(this.listener_id);
            }
        });
    }

    add(tab_object) {
        const tab = new Tab(tab_object);
        tab.tab_element.addEventListener("click", (elem) => this.onClick(elem));

        if (!tab_object.isVisible()) {
            tab.tab_element.classList.add("hidden");
            this.invisible_tabs.push(tab);
        }

        this.tabs[tab.id] = tab;
        this.header.insertBefore(tab.tab_element, this.filler);
        this.content.appendChild(tab.tab_content);
    }

    setActive(id) {
        if (this.active) {
            this.active.object.onExitSelected();
            this.active.setActive(false);
        }
        this.active = this.tabs[id];
        this.active.setActive(true);
        this.active.object.onSelected();
    }

    update() {

    }

    onClick(elem) {
        if (this.active.tab_element === elem.target) {
            return;
        }
        this.setActive(elem.target.id);
    }
}

export class Category {
    constructor(id, parent, text, hidden = false) {
        this.id = id;
        this.element = make({
            parent: parent,
            attr: {
                id: id,
                class: "category",
                data_legend: text,
            },
        });
        if (hidden) {
            makeInvisible();
        }
    }
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
                class: "button-text",
            }
        });
        this.cooldown = make(
            {
                tag: "div",
                parent: this.button_inner,
                attr: {
                    class: "button-cooldown",
                    style: "width: 0%",
                }
            }
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
        this.text.textContent = text;
    }

    setButtonContent(content) {
        this.text.innerHTML = content;
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
        const cur = lerp(100, 0, alpha);
        this.cooldown.setAttribute("style", `width: ${cur}%`)
        requestAnimationFrame((t) => this.cooldownStep(t));
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
                // text += `&lt;div class=&quot;tooltip-item&quot;&gt;${v}&lt;/div&gt;`;
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

export const tab_manager = new TabManager();