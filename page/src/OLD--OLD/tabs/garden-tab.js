import { BaseTab } from "./base-tab.js";
import { ItemCondition } from "src/condition.js"
import { Items, Resources, Colours, MessageTypes } from "src/enums.js"
import { makeVisible, makeInvisible, randomItem } from "src/utils.js"
import { GardenTile, TileState } from "src/garden.js";
import { Button, make, tab_manager } from "src/ui.js"
import { game } from "src/game.js"
import { addListener, removeListener } from "src/messages.js"

let houses = null;
let trees = null;

class TileButton extends Button {
    constructor(id, parent) {
        super(
            id, parent, "tile-text", 1, () => {
                if (!this.garden_tile.step()) return;
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
        if ("icon" in state) {
            const icon = state.icon;
            this.setButtonContent(`${state.name} <span class="garden-tile-emoji" style="color: var(--${Colours.fromIndex(emoji.colour)})">${emoji.text}</span>`);
        }
        else {
            this.setText(state.name);
        }
        let time = state.default_time;
        if ("time" in state) {
            for (const [id, cooldown] of Object.entries(state.time)) {
                const item = game.inventory.getItem(id);
                if (game.inventory.getItem(id).count > 0) {
                    time = cooldown[item.upgrade - 1];
                }
            }
        }
        this.setTimeout(time * .1);

        if (!this.garden_tile.step()) {
            this.setupListener(state.cost);
        }
        else {
            this.setTooltip(null);
        }

        if (this.garden_tile.state === TileState.growing) {
            this.onClick();
        }
    }

    nextState() {
        if (this.garden_tile.nextState()) {
            const harvested = this.garden_tile.harvest().getResults();
            //let msg = "";
            for (const item of harvested) {
                game.inventory.addResource(item.id, item.count);
            //    if (msg.length !== 0) {
            //        msg += " and";
            //    }
            //    msg += ` ${item.count} ${item.name}`
            }
            //game.log("Harvested" + msg);
        }
        this.update();
        if (this.listener_id) {
            removeListener(this.listener_id);
            this.listener_id = null;
        }
    }

    setupListener(cost) {
        let tooltip = [];

        const res = Object.entries(cost);
        for (let i = 0; i < res.length; ++i) {
            tooltip.push(`-${res[i][1]} ${Resources.name(res[i][0])}`)
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
};

class AddTileButton extends Button {
    constructor(id, garden) {
        super(
            id, garden.tiles_element, "Clear Patch", .60, () => {
                garden.addTile();
                game.inventory.addResource(Resources.wood, 100);
            }
        )
        this.button.classList.add("garden-add-path-button");
        this.button.classList.add("garden-tile-button");

        this.cond = new ItemCondition({
            [Items.axe]: 1
        });
        this.disable();
        this.setTooltipText(`Need an ${Items.name(Items.axe)}`);

        let listener_id = addListener((msg, p) => {
            if (msg == MessageTypes.itemUpdate) {
                if (this.cond.step()) {
                    this.cond = null;
                    removeListener(listener_id);
                    this.enable();
                    this.setTooltip(null);  
                }
            }
        })
    }
}

class EmptyTile {
    constructor(index, garden) {
        this.element = make({
            id: `empty-tile-${index}`,
            parent: garden.tiles_element,
            attr: {
                class: "garden-empty-tile",
            }
        });
        this.element.textContent = randomItem(trees);
    }
}

export class GardenTab extends BaseTab {
    constructor() {
        super("garden", "Tent", new ItemCondition({
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
        this.upgrade = 0;
        this.house_anim = null;
        this.tiles = [];
        this.empty_tiles = [];
        this.max_tiles = [
            5, 10, 25
        ];

        this.initialised = false;

        addListener((msg, p) => {
            if (msg == MessageTypes.itemUpdate) {
                if (p.id === Items.house) {
                    this.upgradeHouse();
                }
            }
        })
    }

    /* override */
    onVisible() {
        for (let i = 0; i < 1; ++i) {
            this.tiles.push(new TileButton(`test-tile-${i}`, this.tiles_element));
        }
        this.add_tile = new AddTileButton("garden-add-tile", this);
        const max_trees = this.max_tiles[this.max_tiles.length - 1];
        for (let i = this.tiles.length + 1; i < max_trees; ++i) {
            this.empty_tiles.push(new EmptyTile(i, this));
        }
    }

    addTile() {
        this.tiles_element.removeChild(this.add_tile.button);
        for (const tile of this.empty_tiles) {
            this.tiles_element.removeChild(tile.element);
        }

        this.tiles.push(new TileButton(`test-tile-${this.tiles.length}`, this.tiles_element));
        if (this.tiles.length < this.max_tiles[this.upgrade]) {
            this.empty_tiles.shift();
            this.tiles_element.appendChild(this.add_tile.button);
        }
        for (const tile of this.empty_tiles) {
            this.tiles_element.appendChild(tile.element);
        }
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

    upgradeHouse() {
        this.upgrade = game.inventory.getItem(Items.house).upgrade - 1;
        if (this.upgrade >= this.max_tiles.length) return;
        if (this.upgrade === 0) return;

        for (const tile of this.empty_tiles) {
            this.tiles_element.removeChild(tile.element);
        }
        if (this.tiles.length >= this.max_tiles[this.upgrade - 1]) {
            this.empty_tiles.shift();
            this.tiles_element.appendChild(this.add_tile.button);
        }

        for (const tile of this.empty_tiles) {
            this.tiles_element.appendChild(tile.element);
        }

        const item = Items.fromIndex(Items.house);
        this.tab_header.textContent = item.upgrades[this.upgrade].name;

        this.index = 0;
        if (tab_manager.active.id === this.tab_id) {
            this.updateAnimation();
        }
    }
}


houses = [
    [
`       
        ______      
       /     /\\
      /     /  \\
     /_____/----\\_    )  
    "     "          (.  
   _ ___          o (:') o   
  (@))_))        o ~/~~\\~ o   
                  o  o  o           
`,
`             
        ______
       /     /\\
      /     /  \\
     /_____/----\\_   .(  
    "     "          )   
   _ ___          o (:') o   
  (@))_))        o ~/~~\\~ o   
                  o  o  o               
` ,
`             
        ______
       /     /\\
      /     /  \\      .
     /_____/----\\_    )  
    "     "          (.   
   _ ___          o (:') o   
  (@))_))        o ~/~~\\~ o   
                  o  o  o               
` ,
`             
        ______
       /     /\\
      /     /  \\
     /_____/----\\_   .(  
    "     "          )   
   _ ___          o (:') o   
  (@))_))        o ~/~~\\~ o   
                  o  o  o               
` ,
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


trees = [
`
 8% 
8%88
 || 
`,
`
    %8
 8%8888% 
8%88||
 || 
`,
`
 8%   %8
8%88%8888 
 |8%8%||
   || 
`
]