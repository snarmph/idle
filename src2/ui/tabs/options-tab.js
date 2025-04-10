import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { NumFormatting } from "src/utils/num.js"
import { SimpleButton } from "src/ui/button.js"

export class OptionsTab extends BaseTab {
    constructor() {
        super(OptionsTab.getId(), "Options");

        this.options_elem = ui.htmlFromStr(
            `<div class="options"></div>`,
            this.content_element
        );

        this.addCheckbox("Dark Mode", game.options.dark_mode, () => game.options.toggleDarkMode());

        this.save_elem = ui.htmlFromStr(`<div class="save-btn"></div>`, this.options_elem);
        this.file_elem = ui.htmlFromStr(`<div class="file-btn"></div>`, this.options_elem);

        this.buttons = {
            save: new SimpleButton("save-button", this.save_elem, "Save", () => game.save()),
            load: new SimpleButton("load-button", this.save_elem, "Load", () => game.load()),
            save_to_file:   new SimpleButton("save-to-file-button", this.file_elem, "Save to file", () => this.saveToFile()),
            load_from_file: new SimpleButton("load-from-file-button", this.file_elem, "Load from file", () => this.loadFromFile()),
            delete_save: new SimpleButton("delete-save-button", this.options_elem, "Delete save", () => debug.clearSave()),
        }
    }

    saveToFile() {

    }

    loadFromFile() {

    }

    /* overload */ 
    static getId() {
        return "options";
    }

    /* overload */ 
    onInit() {
        this.show();
    }

    /* overload */ 
    onSelected() {
    }

    /* overload */ 
    onExitSelected() {
    }

    addCheckbox(name, value, onclick) {
        const container = ui.htmlFromStr(
            `<div class="forest-item">
                <div class="item-name">${name}</div>
            </div>`,
            this.options_elem
        );
        const checkbox = ui.htmlFromStr(
            `<div class="options-checkbox"></div>`,
            container
        );
        checkbox.textContent = value ? "[x]" : "[ ]";
        checkbox.addEventListener("click", (e) => {
            const value = onclick();
            checkbox.textContent = value ? "[x]" : "[ ]";
        });
    }

    addSelectBox(name, value, enum_list, onselect) {
        const container = ui.htmlFromStr(
            `<div class="forest-item">
                <div class="item-name">${name}</div>
            </div>`,
            this.options_elem
        );

        // onchange
        const select_elem = ui.htmlFromStr(
            `
            <select id="number_format">
                <button>
                    <selectedcontent></selectedcontent>
                </button>
            </select>
            `, 
            container
        );
        select_elem.addEventListener("change", (e) => {
            onselect(select_elem.selectedIndex);
        });

        // for (const [id, fmt] of NumFormatting.each()) {
        for (const [id, item] of enum_list.each()) {
            let selected = "";
            // if (id === game.options.number_formatting) {
            if (id === value) {
                selected = "selected";
            }
            ui.htmlFromStr(
                `<option value="${id}" ${selected}>${item.name}</option>`,
                select_elem
            );
        }
    }
}