import { lerp } from "src/utils/num.js"

export function htmlFromStr(str, parent = null) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    const element = template.content.firstChild;
    if (parent) parent.appendChild(element);
    return element;
}

export function isVisible(elem) {
    return !elem.classList.contains("hidden");
}

export function setVisible(elem, is_visible = true) {
    if (is_visible) {
        elem.classList.remove("hidden");
    }
    else {
        elem.classList.add("hidden");
    }
}

export class Category {
    constructor(id, parent, text, hidden = false) {
        this.id = id;
        this.element = htmlFromStr(
            `<div id="${id}" class="category" data_legend="${text}"></div>`,
            parent
        );
        setVisible(this.element, hidden);
    }
}
