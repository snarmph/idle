import * as ui from "src/ui/base.js"
import { game } from "src/game.js"

export class Tooltip {
    constructor() {
        this.element = document.getElementById("tooltip");
        this.name_elem = document.getElementById("tooltip-name");
        this.desc_elem = document.getElementById("tooltip-desc");
        this.cost_elem = document.getElementById("tooltip-cost");
        this.x = 0;
        this.y = 0;
        this.is_visible = false;
        this.setVisible(this.is_visible);

        this.fill("Hello", "world", "-5 cookies");

        addEventListener("mousemove", (ev) => this.onMouseMove(ev));
    }

    fill(name, desc, cost) {
        this.name_elem.textContent = name;
        this.desc_elem.textContent = desc;
        this.cost_elem.textContent = cost;
    }

    setVisible(is_visible = true) {
        this.is_visible = is_visible;
        ui.setVisible(this.element, is_visible);
        this.renderTick(game.render.dt);
    }
    
    renderTick(dt) {
        if (!this.is_visible) return;

        const x_off = -1;
        const y_off = this.element.clientHeight + 15;

        const x_pos = this.x - x_off;
        const y_pos = this.y - y_off;

        this.element.style.left = x_pos + "px";
        this.element.style.top  = y_pos + "px";
    }

    onMouseMove(event) {
        this.x = event.clientX;
        this.y = event.clientY;
    }
}