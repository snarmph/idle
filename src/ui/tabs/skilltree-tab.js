import * as ui from "src/ui/base.js"
import * as rand from "src/utils/rand.js"
import * as num from "src/utils/num.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { Colours } from "src/log.js"
import { PinpinType } from "src/village.js"
import { Resources } from "src/inventory.js"
import { SkillsData } from "src/skilltree.js"

let witch_animation = [];

class SkillCell {
    constructor(key, data, parent) {
        this.skill = game.skilltree.get(key);
        this.connections = [];

        this.is_hovering = false;
        this.was_hovering = false;

        this.element = ui.htmlFromStr(
            `<span class="skill-item-container" style="grid-column:${data.x+1};grid-row:${data.y+1}">
                <span id="skill-${key}" class="skill-item">
                    [<span class="skill-icon">${data.icon}</span>]
                </span>
            </span>`,
            parent
        );

        this.element.addEventListener("click", () => this.tryUnlock());
        this.element.addEventListener("mouseout", () => this.is_hovering = false);
        this.element.addEventListener("mouseover", () => this.is_hovering = true);
    }

    tryUnlock() {
        if (this.skill.check() || true) {
            this.skill.unlock();
        }
    }

    renderTick(dt) {
        if (this.is_hovering != this.was_hovering) {
            this.was_hovering = this.is_hovering;
            game.tooltip.setVisible(this.is_hovering);
        }

        if (this.is_hovering) {
            this.updateHoverString();
        }

        let opacity = 0;
        let colour = Colours.base;
        
        if (this.skill.finished_upgrading) {
            opacity = 1;
            colour = Colours.green;
        }
        else if (this.skill.unlocked) {
            opacity = 1;
        }
        else if (this.skill.parent.unlocked) {
            opacity = 0.5;
        }

        this.element.style.opacity = opacity;
        this.element.style.color = `var(--${Colours.fromIndex(colour)})`;

        for (const conn of this.connections) {
            conn.style.opacity = opacity;
            conn.style.color = `var(--${Colours.fromIndex(colour)})`;
        }
    }

    updateHoverString() {
        const skill = this.skill;
        const tip = game.tooltip;
        tip.fill(skill.name, skill.desc, skill.finished_upgrading ? "Unlocked" : "");

        if (skill.finished_upgrading) {
            return;
        }
        
        tip.cost_elem.replaceChildren();

        for (const [id, count] of Object.entries(skill.cost.resources)) {
            let has = game.inventory.countOf(id) >= count;
            ui.htmlFromStr(`
                <div class="tooltip-cost-item ${has ? "tooltip-cost-available" : ""}">
                    <div class="tooltip-cost-count">-${num.format(count)}</div>
                    <div class="tooltip-cost-name">${Resources.name(id)}</div>
                </div>`,
                tip.cost_elem
            );
        }

        for (const [id, count] of Object.entries(skill.cost.pinpins)) {
            let has = game.village.countOf(id) >= count;
            ui.htmlFromStr(`
                <div class="tooltip-cost-item ${has ? "tooltip-cost-available" : ""}">
                    <div class="tooltip-cost-count">-${num.format(count)}</div>
                    <div class="tooltip-cost-name">${PinpinType.name(id)}</div>
                </div>`,
                tip.cost_elem
            );
        }
    }
}

export class SkillTreeTab extends BaseTab {
    constructor() {
        super(SkillTreeTab.getId(), "Skills");
        
        this.grid = ui.htmlFromStr(
            `<div class="skilltree-grid"></div>`,
            this.content_element
        );

        this.skills = [];
        this.addSkillCell("base", SkillsData.base, null);

        this.cooldown = rand.int(5000, 10000);
        this.blinking = false;
    }

    addSkill(id) {
        const len = this.skills.push(new SkillCell(id, this.grid));
        return this.skills[len - 1];
    }

    addConnection(x, y, is_vertical, skill) {
        const element = ui.htmlFromStr(
            `<span class="skill-connection" style="grid-column:${x+1};grid-row:${y+1}">
                ${ is_vertical ? "&nbsp;│&nbsp;" : "───" }
            </span>`,
            this.grid
        );
        skill.connections.push(element);
    }

    addSkillCell(key, data, parent) {
        const new_skill = new SkillCell(key, data, this.grid);
        this.skills.push(new_skill);

        if (parent) {
            let is_vertical = false;
            let x = data.x;
            let y = data.y;

            if (parent.skill.data.x === data.x) {
                is_vertical = true;
                y = parent.skill.data.y + Math.sign(data.y - parent.skill.data.y);
            }
            else {
                x = parent.skill.data.x + Math.sign(data.x - parent.skill.data.x);
            }

            this.addConnection(x, y, is_vertical, new_skill);
        }

        if ("children" in data) {
            for (const [id, child] of Object.entries(data.children)) {
                this.addSkillCell(id, child, new_skill);
            }
        }
    }

    animate(dt) {
        this.cooldown -= dt;
        if (this.cooldown > 0) return;
        if (this.blinking) {
            this.extra.textContent = witch_animation[0];
            this.cooldown = rand.int(5000, 10000);
        }
        else {
            this.extra.textContent = witch_animation[1];
            this.cooldown = 100;
        }
        this.blinking = !this.blinking;
    }

    /* override */ 
    static getId() { 
        return "skilltree";
    }

    /* override */ 
    onInit() {
        this.show();
    }

    /* override */ 
    onVisible() {

    }

    /* override */ 
    onSelected() {

    }

    /* override */ 
    onLogicTick(dt) {

    }

    /* override */ 
    onRenderTick(dt) {
        for (const s of this.skills) {
            s.renderTick(dt);
        }
    }

    /* override */ 
    onExitSelected() {

    }
}


witch_animation = [
`       ,{{}}}}}}.
      {{{{{}}}}}}}.
     {{{{  {{{{{}}}}
    }}}}} _   _ {{{{{
    }}}}  |   |  }}}}}
   {{{{C    ^    {{{{{
  }}}}}}\\   -  /}}}}}}
 {{{{{{{{;.___.;{{{{{{{{
 }}}}}}}}})   (}}}}}}}}}}
{{{{}}}}}':   :{{{{{{{{{{
{{{}}}}}}  \`@\` {{{}}}}}}}
 {{{{{{{{{    }}}}}}}}}
`,
`       ,{{}}}}}}.
      {{{{{}}}}}}}.
     {{{{  {{{{{}}}}
    }}}}} _   _ {{{{{
    }}}}  _   _  }}}}}
   {{{{C    ^    {{{{{
  }}}}}}\\   -  /}}}}}}
 {{{{{{{{;.___.;{{{{{{{{
 }}}}}}}}})   (}}}}}}}}}}
{{{{}}}}}':   :{{{{{{{{{{
{{{}}}}}}  \`@\` {{{}}}}}}}
 {{{{{{{{{    }}}}}}}}}
`,
]