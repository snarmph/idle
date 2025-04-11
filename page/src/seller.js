import * as ui from "src/ui/base.js"
import * as rand from "src/utils/rand.js"
import * as loop from "src/utils/loop.js"
import { game } from "src/game.js"
import { Resources } from "src/inventory.js";
import { BuyPinpinButton  } from "src/ui/button.js";
import { PinpinType } from "src/village.js";
import { Colours } from "src/log.js"

let seller_animation = [];

export class Seller {
    constructor(parent) {
        this.visible = false;

        this.value_mul = {
            [Resources.wheat]: 1,
        };

        this.extra = document.getElementById("extra");
        this.category = new ui.Category("seller", parent, "Seller", false);

        this.buttons = {};
        this.checks = [];
        this.cooldown = rand.int(5000, 10000);
        this.blinking = false;

        this.setup();
    }

    show() {
        this.extra.textContent = seller_animation[0];
    }

    logicTick(dt) {
        loop.check(this.checks);
    }

    renderTick(dt) {
        for (const [_, btn] of Object.entries(this.buttons)) {
            btn.renderTick(dt);
        }

        this.cooldown -= dt;
        if (this.cooldown > 0) return;
        if (this.blinking) {
            this.extra.textContent = seller_animation[0];
            this.cooldown = rand.int(5000, 10000);
        }
        else {
            this.extra.textContent = seller_animation[1];
            this.cooldown = 100;
        }
        this.blinking = !this.blinking;
    }

    setup() {
        this.checks = [
            () => {
                if (game.inventory.totalOf(Resources.wheat) < 10) return false;

                this.buttons.buy_stupid = new BuyPinpinButton(
                    PinpinType.base, 
                    1, 
                    {
                        [Resources.wheat]: 20,
                    },
                    this.category.element
                );
                this.visible = true;
                game.log("A merchant has appeared", Colours.yellow);
                game.log("He talks of creatures called Pinpins, which can do all sort of things", Colours.yellow);
                game.log(`"I'll make you a special price", he says`, Colours.yellow);
                game.log("You don't know if you can trust him", Colours.yellow);
                ui.setVisible(this.category.element)
                // this.show();

                return true;
            }
        ]
    }
}

seller_animation = [
`
          _.-""""-._
         /.-......-.\\
        //          \\\\
        ||          ||
        ||.--    --.||
        /|  . || .  |\\
        \\    (__)    /
         |  ,____,  |
          \\  \`--'  /
       _./\`'.____.'\`\\._
   _.::::|  |    |  |::::._
 .::::::::\\  \\  /  /::::::::.
/::::::::::|/:\\/:\\|::::::::::\\
`,
`
          _.-""""-._
         /.-......-.\\
        //          \\\\
        ||          ||
        ||.--    --.||
        /| __ || __ |\\
        \\    (__)    /
         |  ,____,  |
          \\  \`--'  /
       _./\`'.____.'\`\\._
   _.::::|  |    |  |::::._
 .::::::::\\  \\  /  /::::::::.
/::::::::::|/:\\/:\\|::::::::::\\
`
]