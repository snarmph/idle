import { BaseTab } from "./base-tab.js";
import { ItemCondition } from "script/condition.js"
import { Items, Resources, Colours, MessageTypes } from "script/enums.js"
import { makeVisible, makeInvisible } from "script/utils.js"
import { GardenTile, TileState } from "script/garden.js";
import { Button, make } from "script/ui.js"
import { game } from "script/game.js"
import { addListener, removeListener } from "script/messages.js"


let houses = null;

class TileButton extends Button {
    constructor(id, parent) {
        super(
            id, parent, "tile-text", 1, () => {
                this.nextState();
            }
        )
        this.button.classList.add("garden-tile-button");
        this.addOnClick(() => this.checkCost());
        this.garden_tile = new GardenTile();
        this.listener_id = null;
        this.update();
    }

    update() {
        const state = TileState.fromIndex(this.garden_tile.state);
        this.setText(state.name);
        let time = state.default_time;
        if ("time" in state) {
            console.log(state.time);
            for (const [id, cooldown] of Object.entries(state.time)) {
                if (game.inventory.getItem(id).count > 0) {
                    time = cooldown;
                }
            }
        }
        this.setTimeout(time * 0.1);

        if (!this.garden_tile.step()) {
            this.setupListener(state.cost);
        }
        else {
            this.setTooltip(null);
        }

        if ("message" in state) {
            game.log(`A patch in the garden is ready to be ${state.message}`, Colours.green);
        }
        if (this.garden_tile.state === TileState.growing) {
            this.onClick();
        }
    }

    nextState() {
        if (this.garden_tile.nextState()) {
            const result = this.garden_tile.harvest();
            game.inventory.addResource(result.resource, result.count);
            game.log(`Harvested ${result.count} ${Resources.name(result.resource)}`);
        }
        this.update();
        if (this.listener_id) {
            removeListener(this.listener_id);
            this.listener_id = null;
        }
    }

    setupListener(cost) {
        let tooltip = "";

        const res = Object.entries(cost);
        for (let i = 0; i < res.length; ++i) {
            if (i > 0) {
                tooltip += "\n";
            }
            tooltip += `-${res[i][1]} ${Resources.name(res[i][0])}`;
        }
        
        this.setTooltip(tooltip);
        this.disable();

        this.listener_id = addListener((msg, p) => {
            if (msg === MessageTypes.resourceUpdate) {
                if (this.garden_tile.step()) {
                    this.enable();
                }
                else {
                    this.disable();
                }
            }
        })
    }

    checkCost() {
        const state = TileState.fromIndex(this.garden_tile.state);
        if ("cost" in state) {
            for (const [id, count] of Object.entries(state.cost)) {
                game.inventory.removeResource(id, count);
            }
        }
    }
}

export class GardenTab extends BaseTab {
    constructor() {
        super("garden", "Small House", new ItemCondition({
            [Items.house]: 1,
        }));
        // super("garden", "Garden");

        for (let y = 0; y < houses.length; ++y) {
            for (let x = 0; x < houses[y].length; ++x) {
                houses[y][x] = houses[y][x].slice(houses[y][x].indexOf("\n") + 1);
            }
        }

        this.tiles_element = make({ attr: { class: "garden-tiles" }, parent: this.content_element });

        this.extra = document.getElementById("extra");
        this.index = 0;
        this.upgrade = 1;
        this.house_anim = null;
        this.tiles = [];

        this.initialised = false;
    }

    /* override */
    onVisible() {
        this.tiles.push(new TileButton("test-tile", this.tiles_element));
    }

    /* override */
    onSelected() {
        makeVisible(this.extra.parentElement);
        this.updateAnimation();
        this.house_anim = setInterval(() => this.updateAnimation(), 500);
    }

    /* override */ 
    onExitSelected() {
        makeInvisible(this.extra.parentElement);
        clearInterval(this.house_anim);
        this.house_anim = null;
    }

    updateAnimation() {
        this.extra.textContent = houses[this.upgrade][this.index];
        this.index = (this.index + 1) % houses[this.upgrade].length;
    }
}


houses = [
    [
`             
             )        
            (         
    ________[]_       
   /^=^-^-^=^-^\\      
  /^-^-^-^-^-^-^\\     
 /__^_^_^_^^_^_^_\\    
  |  .==.       |     
^^|  |  |  [}{] |^^^^^
&&|__|__|_______|&&   
     ====             
      ====             
`,
`            
            (        
             )        
    ________[]_       
   /^=^-^-^=^-^\\      
  /^-^-^-^-^-^-^\\     
 /__^_^_^_^^_^_^_\\    
  |  .==.       |     
^^|  |  |  [}{] |^^^^^
&&|__|__|_______|&&   
     ====             
      ====             
` 
    ],
    [
`
            (            
             )           
    ________|| ,%%&%,     
   /\\     _   \\%&&%%&%  
  /  \\___/^\\___\\%&%%&& 
  |  | []   [] |%\\Y&%'   
  |  |   .-.   | ||       
~~@._|@@_|||_@@|~||~~~~~~~
     \`""") )"""\`         
`,
`             
             )          
            (           
    ________|| ,%%&%,     
   /\\     _   \\%&&%%&%  
  /  \\___/^\\___\\%&%%&& 
  |  | []   [] |%\\Y&%'   
  |  |   .-.   | ||       
~~@._|@@_|||_@@|~||~~~~~~~
     \`""") )"""\`         
`,
    ],
];  