import { htmlFromStr } from "src/ui/base.js";
import { makeVisible, makeInvisible } from "src/ui/base.js";

export class BaseTab {
    constructor(id, name) {
        this.id = id;
        this.tab_id = `tab-${id}`;
        this.content_id = `content-${id}`;
        this.name = name;
        this.is_active = false;
        this.is_visible = false;

        this.tab_elem = htmlFromStr(
            `<div id="${this.tab_id}" class="tab-item">${this.name}</div>`
        )
        this.tab_content = htmlFromStr(
            `<div class="tab-content-item hidden"></div>`
        )
        this.content_element = htmlFromStr(
            `<div id="${this.content_id}"></div>`,
            this.tab_content
        );

        this.tab_header = document.getElementById(this.tab_id);
        this.extra = document.getElementById("extra");
    }

    updateName(name) {
        this.name = name;
        this.tab_elem.textContent = name;
    }

    setActive(is_active = true) {
        this.is_active = is_active;
        if (is_active) {
            this.tab_elem.classList.add("tab-active");
            this.tab_content.classList.remove("hidden");
        }
        else {
            this.tab_elem.classList.remove("tab-active");
            this.tab_content.classList.add("hidden");
        }
    }

    show() {
        if (this.is_visible) return;
        this.is_visible = true;
        makeVisible(this.tab_elem);
        this.onVisible();
    }

    /* virtual */ static getId() { return ""; }
    /* virtual */ onInit() {}
    /* virtual */ onVisible() {}
    /* virtual */ onSelected() {}
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
        makeInvisible(tab.tab_elem);
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
    }

    show(tab_or_id) {
        const id = tab_or_id;
        if (typeof(tab_or_id) !== "string") {
            id = tab_or_id.id;
        }
        this.tabs[id].show();
    }

    onClick(elem) {
        if (this.active.tab_elem === elem.target) {
            return;
        }
        this.setActive(elem.target.id.slice(4));
    }
}