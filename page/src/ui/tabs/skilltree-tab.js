import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { Skills } from "src/skill-tree.js"

export class SkillTreeTab extends BaseTab {
    constructor() {
        super(SkillTreeTab.getId(), "Skills");
        this.grid_width  = game.skill_tree.width;
        this.grid_height = game.skill_tree.height;

        this.skill_string = [];
        this.skill_string.length = this.grid_width * this.grid_height;
        this.addSkillCell("base", Skills.base, null);

        let grid = "";
        for (let y = 0; y < this.grid_height; ++y) {
            for (let x = 0; x < this.grid_width; ++x) {
                const i = x + y * this.grid_width;
                if (this.skill_string[i]) {
                    grid += this.skill_string[i];
                }
                else {
                    grid += `<span class="skill-whitespace">&nbsp;&nbsp;&nbsp;</span>`;
                }
            }
            grid += "<br>";
        }

        this.grid = ui.htmlFromStr(
            `<div class="skill-tree-grid">${grid}</div>`,
            this.content_element
        );

/*
        this.grid_elem = ui.htmlFromStr(
            `
            <span class="skill-item-container">
                <span id="skill-id" class="skill-item">
                    [<span class="skill-icon" style="color: red">g</span>]
                </span>
            </span>
            `,
            this.content_element
        );
*/
    }

    fillGridSkill(x, y, id, icon) {
        this.skill_string[x + y * this.grid_width] = `<span class="skill-item-container"><span id="skill-${id}" class="skill-item">[<span class="skill-icon" style="color: red">${icon}</span>]</span></span>`;
    }

    fillGridConnection(x, y, is_vertical) {
        this.skill_string[x + y * this.grid_width] = `<span class="skill-connection">${ is_vertical ? "&nbsp;│&nbsp;" : "───" }</span>`
    }

    addSkillCell(key, skill, parent) {
        this.fillGridSkill(skill.x, skill.y, key, skill.icon);

        if (parent) {
            let is_vertical = false;
            let x = skill.x;
            let y = skill.y;

            if (parent.x === skill.x) {
                is_vertical = true;
                y = parent.y + Math.sign(skill.y - parent.y);
            }
            else {
                x = parent.x + Math.sign(skill.x - parent.x);
            }

            this.fillGridConnection(x, y, is_vertical);
        }

        if ("children" in skill) {
            for (const [id, child] of Object.entries(skill.children)) {
                this.addSkillCell(id, child, skill);
            }
        }
    }

    /* overload */ 
    static getId() {
        return "skill-tree";
    }

    /* overload */ 
    onInit() {
        this.show();
    }

    /* overload */ 
    onSelected() {
    }

    /* overload */ 
    onExitSelected() {
    }
}