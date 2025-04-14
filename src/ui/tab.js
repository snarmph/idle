import * as ui from "src/ui/base.js"
import { game } from "src/game.js"

export class BaseTab {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.tab_id = `tab-${id}`;
        this.content_id = `content-${id}`;
        this.is_active = false;
        this.is_visible = false;

        this.tab_elem = ui.htmlFromStr(
            `<div id="${this.tab_id}" class="tab-item">${this.name}</div>`
        )
        this.tab_content = ui.htmlFromStr(
            `<div class="tab-content-item hidden"></div>`
        )
        this.content_element = ui.htmlFromStr(
            `<div id="${this.content_id}"></div>`,
            this.tab_content
        );

        this.extra = document.getElementById("extra");
    }

    updateName(name) {
        this.name = name;
        this.tab_elem.textContent = name;
    }

    setActive(is_active = true) {
        this.is_active = is_active;
        ui.setVisible(this.tab_content, is_active);
        if (is_active) {
            this.tab_elem.classList.add("tab-active");
        }
        else {
            this.tab_elem.classList.remove("tab-active");
        }
    }
    
    show() {
        if (this.is_visible) return;
        this.is_visible = true;
        ui.setVisible(this.tab_elem, true);
        this.onVisible();
    }

    /* virtual */ static getId() { return ""; }
    /* virtual */ onInit() {}
    /* virtual */ onVisible() {}
    /* virtual */ onSelected() {}
    /* virtual */ onLogicTick(dt) {}
    /* virtual */ onRenderTick(dt) {}
    /* virtual */ onExitSelected() {}
}

export class TabManager {
    constructor() {
        this.header = document.getElementById("tab-header");
        this.content = document.getElementById("main-content");
        this.filler = document.getElementById("tab-filler");
        this.tabs = {};
        this.active = null;
    }
    
    add(tab) {
        tab.tab_elem.addEventListener("click", (elem) => this.onClick(elem));
        ui.setVisible(tab.tab_elem, false);
        this.header.insertBefore(tab.tab_elem, this.filler);

        this.tabs[tab.id] = tab;
        this.content.appendChild(tab.tab_content);

        tab.onInit();
    }
    
    setActive(tab_or_id) {
        const id = tab_or_id;
        if (typeof(tab_or_id) !== "string") {
            id = tab_or_id.id;
        }

        if (this.active) {
            this.active.onExitSelected();
            this.active.setActive(false);
        }
        this.active = this.tabs[id];
        this.active.setActive();
        this.active.onSelected();
        this.active.onRenderTick(game.render.dt);
    }

    show(tab_or_id) {
        const id = tab_or_id;
        if (typeof(tab_or_id) !== "string") {
            id = tab_or_id.id;
        }
        this.tabs[id].show();
    }

    logicTick(dt) {
        for (const [_, tab] of Object.entries(this.tabs)) {
            tab.onLogicTick(dt);
        }
    }

    renderTick(dt) {
        this.active.onRenderTick(dt);
    }

    onClick(elem) {
        if (this.active.tab_elem === elem.target) {
            return;
        }
        this.setActive(elem.target.id.slice(4)); // remove "tab-"
    }
}