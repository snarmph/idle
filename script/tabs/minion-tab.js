import { MinionType, Minion, Village } from "script/minion.js";
import { addListener } from "script/messages.js";
import { MessageTypes } from "script/enums.js";
import { game } from "script/game.js"
import { make } from "script/ui.js"

let minion_anim = null;

export class VillageTab {
    constructor() {
        this.title_element = document.getElementById("minion-title");
        this.data_element = document.getElementById("minion-data");

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
