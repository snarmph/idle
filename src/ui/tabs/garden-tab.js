import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { Button } from "src/ui/button.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js"
import { PinpinType } from "src/village.js"
import { addListener, MessageTypes } from "src/messages.js"
import { HouseLevels, TileState } from "src/garden.js"
import { Colours } from "src/log.js"
import { formatRaw } from "src/utils/num.js"

let house_animations = [];

class TileButton extends Button {
    constructor(index, parent) {
        super(
            `garden-tile-${index}`, parent, "tile-text"
        )
        this.count = 0;

        this.index = index;
        this.button.classList.add("garden-tile-button");

        const tile = game.garden.tiles[this.index];
        tile.on_start_cooldown = () => this.disable();
        tile.on_step_cooldown = (alpha) => this.setCooldownBarWidth(alpha);
        tile.on_end_cooldown = () => this.update();
        this.update();
    }

    update() {
        const tile = game.garden.tiles[this.index];
        const state = TileState.fromIndex(tile.state);
        let text = state.name;
        if ("icon" in state) {
            const colour = Colours.fromIndex(state.icon.colour);
            text += ` <span class="garden-tile-emoji" style="color: var(--${colour})">${state.icon.text}</span>`
        }
        this.setButtonContent(text);

        if (!tile.check()) this.disable();
        else               this.enable();
    }

    /* override */
    onClick() {
        game.garden.tiles[this.index].tryNext();
    }
}

export class GardenTab extends BaseTab {
    constructor() {
        super(GardenTab.getId(), "House");

        this.tiles_elem = ui.htmlFromStr(
            `<div class="garden-tiles"></div>`,
            this.content_element
        );

        this.level = null;
        this.tiles = [];

        this.anim_index = 0;
        this.anim_id = null;

        addListener(MessageTypes.houseUpgrade, (data) => {
            this.onHouseUpgrade(data.level);
        })
    }

    /* overload */ 
    static getId() {
        return "garden"; 
    }

    /* overload */ 
    onInit() {
        game.garden.upgrade();
        game.garden.upgrade();
        game.garden.upgrade();
        this.show();
    }

    /* overload */ 
    onVisible() {
        addListener(
            MessageTypes.resourceUpdate, 
            () => {
                for (let i = 0; i < this.tiles.length; ++i) {
                    const garden_tile = game.garden.tiles[i];
                    if (garden_tile.check()) {
                        this.tiles[i].enable();
                    }
                    else {
                        this.tiles[i].disable();
                    }
                }
            }
        );
        addListener(
            MessageTypes.gardenUpdate,
            (data) => {
                this.tiles[data.index].update();
                if (data.harvest) {
                    let msg = "Harvested ";
                    for (let i = 0; i < data.harvest.length; ++i) {
                        const res = data.harvest[i];
                        msg += `${res.name}: ${formatRaw(res.count)}`;
                        if (i + 1 < data.harvest.length) msg += ", ";
                    }
                    game.log(msg);
                }
            }
        )
        addListener(
            MessageTypes.pinpinAction,
            (data) => {
                if (data.type !== PinpinType.farmer) {
                    return;
                }
                this.tiles[data.index].click();
            }
        )
    }

    /* overload */ 
    onSelected() {
        ui.makeVisible(this.extra.parentElement);
        this.anim_index = 0;
        this.updateAnimation();
        this.anim_id = setInterval(() => this.updateAnimation(), 500);
    }

    /* overload */ 
    onExitSelected() {
        ui.makeInvisible(this.extra.parentElement);
        clearInterval(this.anim_id);
        this.anim_id = null;
        this.anim_index = 0;
    }

    onHouseUpgrade(level) {
        this.level = level;
        this.anim_index = 0;
        this.updateName(HouseLevels.name(level));
        const old_len = this.tiles.length;
        const len = game.garden.tiles.length;
        for (let i = old_len; i < len; ++i) {
            this.tiles.push(new TileButton(i, this.tiles_elem));
        }
    }

    updateAnimation() {
        const anim = house_animations[this.level - 1];
        this.extra.textContent = anim[this.anim_index];
        this.anim_index = (this.anim_index + 1) % anim.length;
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