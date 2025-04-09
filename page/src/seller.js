import { game } from "src/game.js"
import { sendMsg, MessageTypes, addListener, removeListener } from "src/messages.js"
import * as ui from "src/ui/base.js"
import { ResourceCondition, SkillCondition } from "src/condition.js";
import { Resources } from "src/inventory.js";
import { SellButton, ExchangeResButton, BuyPinpinButton  } from "src/ui/button.js";
import { PinpinType } from "src/village.js";
import { Colours } from "src/log.js"
import { getRandomInt } from "src/utils/rand.js"
import { Skill } from "src/skill-tree.js";
import { forEachCond } from "src/condition.js";

let seller_animation = [];

export class Seller {
    constructor(parent) {
        this.visible = false;
        this.timer = null;
        this.listen_id = null;

        this.value_mul = {
            [Resources.wheat]: 1,
        };
        
        this.extra = document.getElementById("extra");
        this.category = new ui.Category("seller", parent, "Seller");
        ui.makeInvisible(this.category.element);

        this.buttons = {};
        this.conditions = [];

        this.setupConditions();
    }

    step() {
        if (this.conditions.length === 0) {
            removeListener(MessageTypes.resourceUpdate, this.listen_id);
            this.listen_id = null;
            return;
        }
        forEachCond(this.conditions);
    }

    animate() {
        this.extra.textContent = seller_animation[0];
        const timeout = getRandomInt(5000, 10000);
        clearTimeout(this.timer);
        this.timer = setTimeout(
            () => {
                clearTimeout(this.timer);
                this.extra.textContent = seller_animation[1];
                this.timer = setTimeout(
                    () => {
                        this.animate();
                    },
                    100
                );
            },
            timeout
        );
    }

    setupConditions() {
        this.conditions = [
            new ResourceCondition(
                { [Resources.wheat]: 10 },
                () => {
                    this.visible = true;
                    this.buttons.sell_wheat = new SellButton(
                        Resources.wheat, 5,
                        this.category.element
                    );
                    this.buttons.stone_for_wood = new ExchangeResButton(
                        Resources.stone, 1,
                        Resources.wood, 20,
                        this.category.element
                    );
                    game.log("A merchant has appeared", Colours.yellow);
                    sendMsg(MessageTypes.eventUpdate, "show-seller");
                },
                true
            ),
            new ResourceCondition(
                { [Resources.seeds]: 100 },
                () => {
                    this.buttons.sell_seeds = new SellButton(
                        Resources.seeds, 20,
                        this.category.element
                    );
                }
            ),
            new ResourceCondition(
                { [Resources.money]: 10 },
                () => {
                    this.buttons.wheat_for_wood = new ExchangeResButton(
                        Resources.wheat, 1,
                        Resources.wood, 50,
                        this.category.element
                    );
                    this.buttons.pinpin_base = new BuyPinpinButton(
                        PinpinType.base,
                        1,
                        this.category.element
                    );
                    game.log("You can now buy Pinpins!", Colours.green);
                }, 
                true
            ),
        ];

        new SkillCondition(
            "merchant_pp_sell",
            (skill) => {
                let type = [
                    PinpinType.explorer,
                    PinpinType.miner,
                    PinpinType.farmer,
                    PinpinType.seller,
                ];
                const btn = new BuyPinpinButton(
                    type[skill.upgrade],
                    1,
                    this.category.element
                );
                btn.checkCondition();
                this.buttons[`pinpin_${PinpinType.key(type)}`] = btn;

            }
        );

        new SkillCondition(
            "merchant_crops",
            (skill) => {
                let count = [
                    { sell: 10, barter: 2 },
                    { sell: 50, barter: 5 },
                    { sell: 1000, barter: 200 },
                ];
                count = count[skill.upgrade];
                for (const [_, btn] of Object.entries(this.buttons)) {
                    switch (btn.constructor.name) {
                        case SellButton.name:
                            btn.setSellCount(count.sell);
                            break;
                        case ExchangeResButton.name:
                            btn.get_count = count.barter;
                            btn.update();
                            break;
                    }
                }
            }
        )

        new SkillCondition(
            "merchant_gen",
            (skill) => {
                let add_mul = [
                    5,
                    10,
                    30,
                    50
                ];
                add_mul = add_mul[skill.upgrade];
                this.value_mul[Resources.wheat] += add_mul * 0.01;
                this.buttons.sell_wheat.setValueMultiplier(this.value_mul[Resources.wheat]);
            }
        )
        
        this.listen_id = addListener(
            MessageTypes.resourceUpdate,
            () => this.step()
        );

        this.step();
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
/:::::::::::|/:\\/:\\|::::::::::\\
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
/:::::::::::|/:\\/:\\|::::::::::\\
`
]