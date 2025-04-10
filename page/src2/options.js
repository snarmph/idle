import { setNumberFormatter, getNumberFormatter } from "src/utils/num.js"

export class Options {
    constructor() {
        this.dark_mode = true;
    }

    toggleDarkMode() {
        this.dark_mode = !this.dark_mode;
        const add_remove = [ [ "light-mode", "dark-mode" ], [ "dark-mode", "light-mode" ] ];
        document.body.classList.add(add_remove[Number(this.dark_mode)][0]);
        document.body.classList.remove(add_remove[Number(this.dark_mode)][1]);
        return this.dark_mode;
    }
}