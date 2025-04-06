import { make, tab_manager } from "src/ui.js";

export class BaseTab {
    constructor(id, name, show_cond = null) {
        this.tab_id = `tab-${id}`;
        this.content_id = `content-${id}`;
        this.name = name;
        this.content_element = make({ attr: { id: this.content_id } });
        this.show_cond = show_cond;

        // tab_manager.add(this.tab_id, this.name, this.content_element);
        tab_manager.add(this);

        this.tab_header = document.getElementById(this.tab_id);
    }

    isVisible() {
        if (this.show_cond === null) return true;
        return this.show_cond.step();
    }

    /* virtual */ onVisible() {}
    /* virtual */ onSelected() {}
    /* virtual */ onExitSelected() {}
}