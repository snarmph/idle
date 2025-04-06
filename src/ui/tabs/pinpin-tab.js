import { BaseTab } from "./base-tab.js";
import { make, htmlFromStr } from "src/ui/base.js"
import { addListener, MessageTypes } from "src/messages.js";

export class VillageTab extends BaseTab {
    constructor(village) {
        super("village", "Pinpins");

        this.village = village;
        this.data_elem = make({ attr: { class: "minion-data"}, parent: this.content_element });

        addListener(MessageTypes.minionUpdate, () => {
            this.updateData();
        });
    }

    updateData() {
        let children = [];

        for (const [type, minion] of MinionType.each()) {
            const count = this.village.countOf(type);
            if (count <= 0) continue;

            const div = htmlFromStr(`
            <div id="minion-type-${minion.name}" class="minion-type-container">
                <div class="minion-type-name">${minion.name}</div>
                <div class="minion-type-count">${count}</div>
            </div>
            `);
            children.push(div);
        }

        this.data_elem.replaceChildren(...children);
    }
}