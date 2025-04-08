import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { SkillsData } from "src/skill-tree.js"
import { Colours } from "src/log.js"

class SkillTab {
    constructor(element, skill) {
        this.element = element;
        this.skill = skill;
        this.connections = [];

        skill.on_unlocked.push(() => this.update());
    }

    update() {
        let new_class = "hidden";
        if (this.skill.unlocked) {
            new_class = "skill-unlocked";
        }
        else if (this.skill.parent && this.skill.parent.unlocked) {
            new_class = "skill-visible";
        }
        this.element.classList.add(new_class);
        for (const conn of this.connections) {
            conn.classList.add(new_class);
        }
    }
}

export class SkillTreeTab extends BaseTab {
    constructor() {
        super(SkillTreeTab.getId(), "Skills");
        this.grid_width  = game.skill_tree.width;
        this.grid_height = game.skill_tree.height;
        this.is_hovering = false;

        this.onMouseMoveHandler = (event) => this.onMouseMove(event); 
        
        this.grid = ui.htmlFromStr(
            `<div class="skill-tree-grid"></div>`,
            this.content_element
        );

        this.skills = [];
        this.addSkillCell("base", SkillsData.base, null);

        for (const s of this.skills) {
            s.update();
        }

        const tooltip_container = ui.htmlFromStr(
            `<div class="skill-tooltip"></div>`,
            document.body
        );

        this.tooltip = {
            container: tooltip_container,
            name: ui.htmlFromStr(`<div class="skill-tooltip-name"></div>`, tooltip_container),
            desc: ui.htmlFromStr(`<div class="skill-tooltip-desc"></div>`, tooltip_container),
            cost: ui.htmlFromStr(`<div class="skill-tooltip-cost"></div>`, tooltip_container),
            setPos: (x, y) => {
                tooltip_container.style.left = x + "px";
                tooltip_container.style.top  = y + "px";
            },
            setVisibility: (visible) => {
                tooltip_container.style.opacity = visible ? "1.0" : "0.1";
            },
            height() {
                return tooltip_container.clientHeight;
            }
        };

    }

    addSkill(id, x, y, icon) {
        const element = ui.htmlFromStr(
            `<span class="skill-item-container" style="grid-column:${x+1};grid-row:${y+1}">
                <span id="skill-${id}" class="skill-item">
                    [<span class="skill-icon">${icon}</span>]
                </span>
            </span>`,
            this.grid
        );
        element.addEventListener("mouseover", () => this.is_hovering = true);
        element.addEventListener("mouseout", () => this.is_hovering = false);
        const len = this.skills.push(new SkillTab(element, game.skill_tree.get(id)));
        return len - 1;
    }


    addConnection(x, y, is_vertical, parent_index) {
        const element = ui.htmlFromStr(
            `<span class="skill-connection" style="grid-column:${x+1};grid-row:${y+1}">
                ${ is_vertical ? "&nbsp;│&nbsp;" : "───" }
            </span>`,
            this.grid
        );
        this.skills[parent_index].connections.push(element);
    }

    addSkillCell(key, skill, parent) {
        const index = this.addSkill(key, skill.x, skill.y, skill.icon);

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

            this.addConnection(x, y, is_vertical, index);
        }

        if ("children" in skill) {
            for (const [id, child] of Object.entries(skill.children)) {
                this.addSkillCell(id, child, skill);
            }
        }
    }

    onMouseMove(event) {
        if (!this.is_hovering) {
            this.tooltip.setVisibility(false);
            return;
        }

        const off_y = this.tooltip.height() + 15;
        const off_x = -5;

        let posx = event.clientX - off_x;
        let posy = event.clientY - off_y;

        this.tooltip.setPos(posx, posy);
        this.tooltip.setVisibility(true);
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
        addEventListener("mousemove", this.onMouseMoveHandler);
    }

    /* overload */ 
    onExitSelected() {
        removeEventListener("mousemove", this.onMouseMoveHandler);
    }
}