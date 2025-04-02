import { make } from "script/ui.js"
import { lerp } from "script/utils.js"
import { Colours } from "script/enums.js"

class LogItem {
    constructor(msg, parent, color) {
        this.msg = msg;
        this.element = make({
            content: msg,
            attr: {
                class: "log-item",
                colour: `var(--${color})`,
            }
        });

        
        this.element.style.color = `var(--${Colours.fromIndex(color)})`;
        
        parent.insertBefore(this.element, parent.children[0]);
    }
}

export class Logger {
    constructor() {
        this.element = document.getElementById("log");
        this.max_count = 20;
        this.messages = [];
    }

    print(msg, color) {
        if (this.messages.length >= this.max_count) {
            let removed = this.messages.shift();
            removed.element.remove();
        }
        this.messages.push(new LogItem(msg, this.element, color));

        const alpha_step = 1.0 / this.max_count;
        let alpha = 1.0;

        for (let i = this.messages.length - 1; i >= 0; --i) {
            this.messages[i].element.style.opacity = alpha;
            alpha -= alpha_step;
        }
    }
}