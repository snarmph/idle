import { game } from "src/game.js"

export class SaveData {
    constructor() {
        this.save_data = {};
        this.load_data = {};
    }

    hasSaveData() {
        return localStorage.getItem("pinpin-idle") !== null;
    }

    add(name) {
        this.save_data[name] = game[name].getSaveData();
    }

    save() {
        // backup previous save too
        const old_value = localStorage.getItem("pinpin-idle");
        localStorage.setItem("pinpin-idle", JSON.stringify(this.save_data));
        localStorage.setItem("pinpin-idle-prev", old_value);
    }

    tryLoad() {
        const data = localStorage.getItem("pinpin-idle");
        this.load_data = JSON.parse(data);
        if (this.load_data === null) return false;

        for (const [name, data] of Object.entries(this.load_data)) {
            game[name].loadSaveData(data);
        }

        return true;
    }

    clear() {
        localStorage.clear();
    }
}