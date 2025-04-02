import { make, Category, Button, tab_manager } from "script/ui.js";
import { getRandomInt } from "script/utils.js";

export class Cave {
    constructor() {
        this.content_element = make({ attr: { id: "cave-content" } });
        this.inner_element   = make({ attr: { class: "cave-inner" }, parent: this.content_element });

        const size = 15;
        this.inner_element.setAttribute("style", `grid-template-columns: repeat(${size}, 1fr); grid-template-rows: repeat(${size}, 1fr)`);

        this.grid = new Array(size * size);
        const colors = [ "red", "green", "blue" ];
        for (let y = 0; y < size; ++y) {
            for (let x = 0; x < size; ++x) {
                const i = x + y * size;
                this.grid[i] = make({ attr: { class: "cave-block" }, parent: this.inner_element });
                this.grid[i].textContent = ".";
            }
        }

        this.grid[getRandomInt(0, 100)].textContent = "@";

        tab_manager.add(this.getTabId(), "Cave", this.content_element);
    }

    getTabId() {
        return "cave";
    }
}