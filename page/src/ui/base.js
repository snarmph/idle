import { lerp } from "src/utils/num.js"

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

export function htmlFromStr(str, parent = null) {
    const template = document.createElement('template');
    template.innerHTML = str.trim();
    const element = template.content.firstChild;
    if (parent) parent.appendChild(element);
    return element;
}

export function isElementVisible(elem) {
    return !elem.classList.contains("hidden");
}

export function makeVisible(elem) {
    elem.classList.remove("hidden");
}

export function makeInvisible(elem) {
    elem.classList.add("hidden");
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
