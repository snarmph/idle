import * as ui from "src/ui/base.js"
import * as num from "src/utils/num.js"
import * as rand from "src/utils/rand.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { Button, CooldownButton } from "src/ui/button.js"
import { Resources } from "src/inventory.js"
import { HouseLevels, TileState } from "src/garden.js"
import { Colours } from "src/log.js"

let house_animations = [];

class TileButton extends CooldownButton {
    constructor(index, parent) {
        super(
            `garden-tile-${index}`, 
            parent, 
            "tile-text",
            0,
            null,
            () => game.garden.tiles[this.index].start()
        );
        this.count = 0;

        this.index = index;
        this.state = null;
        this.element.classList.add("garden-tile-button");
    }

    renderTick(dt) {
        if (this.index >= game.garden.tiles.length) return;
        this.is_in_cooldown = false;

        const tile = game.garden.tiles[this.index];

        this.setCooldownBarWidth(tile.getAlpha());
        this.setEnabled(tile.check());

        if (this.state != tile.state) {
            this.state = tile.state;
            this.updateText();
        }
    }

    updateText() {
        const state = TileState.fromIndex(this.state);
        let text = state.name;
        if ("icon" in state) {
            const colour = Colours.fromIndex(state.icon.colour);
            text += ` <span class="garden-tile-emoji" style="color: var(--${colour})">${state.icon.text}</span>`
        }
        this.setContent(text);
    }
}

export class GardenTab extends BaseTab {
    constructor() {
        super(GardenTab.getId(), "Garden");

        this.tiles_elem = ui.htmlFromStr(
            `<div class="garden-tiles"></div>`,
            this.content_element
        );

        this.tiles = [];
        this.level = null;

        this.anim_index = 0;
        this.anim_time = 500;
    }

    /* override */ 
    static getId() {
        return "garden";
    }

    /* override */ 
    onInit() {
        for (let i = 0; i < 25; ++i) {
            const tile = new TileButton(i, this.tiles_elem);
            tile.setVisible(false);
            this.tiles.push(tile);
        }
    }

    /* override */ 
    onVisible() {

    }

    /* override */ 
    onSelected() {
        ui.setVisible(this.extra.parentElement);
        this.anim_index = 0;
        this.extra.textContent = house_animations[game.garden.level - 1][this.anim_index];
    }

    /* override */ 
    onLogicTick(dt) {
    }

    /* override */ 
    onRenderTick(dt) {
        if (game.garden.level != this.level) {
            this.onHouseUpgrade();
        }
        for (const tile of this.tiles) {
            tile.renderTick(dt);
        }
        this.updateAnimation(dt);
    }

    /* override */ 
    onExitSelected() {
        ui.setVisible(this.extra.parentElement, false);
    }

    onHouseUpgrade() {
        this.level = game.garden.level;
        const data = HouseLevels.fromIndex(this.level);
        this.updateName(data.name);
        for (let i = 0; i < data.tiles; ++i) {
            this.tiles[i].setVisible(true);
        }
        this.anim_index = 0;
        this.anim_time = 0;
    }

    updateAnimation(dt) {
        this.anim_time -= dt;
        while (this.anim_time < 0) {
            this.anim_time += 500;
            const anim = house_animations[game.garden.level - 1];
            this.anim_index = (this.anim_index + 1) % anim.length;
            this.extra.textContent = anim[this.anim_index];
        }
    }
}


house_animations = [
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
    [
`
               T~~
               |
              /"\\
      T~~     |'| T~~
  T~~ |    T~ WWWW|
  |  /"\\   |  |  |/\\T~~
 /"\\ WWW  /"\\\\ |' |WW|
WWWWW/\\| /   \\|'/\\|/"\\
|   /__\\/]WWW[\\/__\\WWWW
|"  WWWW'|I_I|'WWWW'  |
|   |' |/  -  \\|' |'  |
|'  |  |LI=H=LI|' |   |
|   |' | |[_]| |  |'  |
|   |  |_|###|_|  |   |
'---'--'-/___\\-'--'---'
`,
    ],
];  