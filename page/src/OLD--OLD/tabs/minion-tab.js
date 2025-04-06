import { BaseTab } from "tabs/base-tab.js";
import { Condition } from "src/condition.js"
import { Category } from "src/ui.js"
import { MinionType, Minion, Village } from "src/minion.js";
import { addListener } from "src/messages.js";
import { MessageTypes } from "src/enums.js";
import { game } from "src/game.js"
import { make } from "src/ui.js"

let minion_anim = null;

export class VillageTab extends BaseTab {
    constructor() {
        super("village", "Pinpins", new Condition(() => game.village.count() > 0));
        
        this.extra = document.getElementById("extra");

        this.data_element = make({ attr: { class: "minion-data"}, parent: this.content_element });

        addListener((msg, p) => {
            if (msg !== MessageTypes.minionUpdate) return;
            this.updateData(p);
        })
    }

    updateData(data) {
        let children = [];


        for (const [type, minion] of MinionType.each()) {
            const count = game.village.countOf(type);
            if (count <= 0) continue;
            
            const container = make({
                id: `minion-type-${minion.name}`,
                attr: {
                    class: "minion-type-container",
                },
            });
            const item_name = make({
                parent: container,
                content: minion.name,
                attr: {
                    class: "minion-type-name",
                }
            });
            const item_count = make({
                parent: container,
                content: count,
                attr:{
                    class: "minion-type-count",
                },
            });
            children.push(container);
        }
/*
        for (const [type, minion] of MinionType.each()) {
            const count = game.village.countOf(type);
            if (count <= 0) continue;
            
            let container = make({
                id: `minion-type-${minion.name}`,
                attr: {
                    class: "minion-type-container",
                },
            });
            let item_name = make({
                parent: container,
                content: minion.name,
                attr: {
                    class: "minion-type-name",
                }
            });
            let item_count = make({
                parent: container,
                content: count,
                attr:{
                    class: "minion-type-count",
                },
            });
            children.push(container);
            // game.village.minions[type].count;
        }
*/
        this.data_element.replaceChildren(...children);
        
        game.village.minions;
        game.village;
    }
}

minion_anim = {
    [MinionType.base]: [
`
  _____ 
 / .  .\
/\__ u_/\
   L L
`,
`
  _____ 
 / .  .\
/\__ u_/\
   \,/
`,
`
  _____ 
 / .  .\
/\__ u_/\
  ;/  \,
`,
    ],
    [MinionType.explorer]: [
`
  _____ 
 / ,  ,\
/\__ >_/\
   L L
`,
`
  _____ 
 / ,  ,\
/\__ >_/\
   \,/
`,
`
  _____ 
 / ,  ,\
/\__ >_/\
  ;/  \,
`,
    ],
    [MinionType.farmer]: [
`
  _/ \_ 
 / .  .\
/\__ u_/\
   L L
`,
`
  _/ \_ 
 / .  .\
/\__ u_/\
   \,/
`,
`
  _/ \_ 
 / .  .\
/\__ u_/\
  ;/  \,
`,
    ],
};
