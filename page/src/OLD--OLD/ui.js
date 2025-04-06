import { addListener, removeListener } from "src/messages.js"

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

export const tab_manager = new TabManager();