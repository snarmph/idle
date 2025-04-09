import * as ui from "src/ui/base.js"
import { BaseTab } from "src/ui/tab.js"
import { game } from "src/game.js"
import { SkillsData } from "src/skill-tree.js"
import { formatNumber } from "src/utils/num.js"
import { PinpinType } from "src/village.js"
import { Resources } from "src/inventory.js"
import { addListener, MessageTypes } from "../../messages.js"

class SkillTab {
    constructor(element, skill) {
        this.element = element;
        this.skill = skill;
        this.connections = [];

        this.element.addEventListener("click", () => {
            this.skill.tryUnlock(true);
        })

        skill.on_unlocked.push(() => this.update());
    }

    update() {
        let new_class = "hidden";
        if (this.skill.finished_upgrading) {
            new_class = "skill-finished";
        }
        else if (this.skill.unlocked) {
            new_class = "skill-unlocked";
        }
        else if (this.skill.parent && this.skill.parent.unlocked) {
            new_class = "skill-visible";
        }
        this.element.classList.remove("hidden");
        this.element.classList.remove("skill-unlocked");
        this.element.classList.remove("skill-visible");

        this.element.classList.add(new_class);
        for (const conn of this.connections) {
            conn.classList.remove("hidden");
            conn.classList.remove("skill-unlocked");
            conn.classList.remove("skill-visible");
            conn.classList.add(new_class);
        }

        if (this.skill.unlocked) {

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

        const tooltip_container = document.getElementById("tooltip");

        this.tooltip = {
            container: tooltip_container,
            name: document.getElementById("tooltip-name"),
            desc: document.getElementById("tooltip-desc"),
            cost: document.getElementById("tooltip-cost"),
            xpos: 0,
            ypos: 0,
            setVisibility: (visible) => {
                tooltip_container.style.opacity = visible ? "1.0" : "0.0";
            },
        };

        this.tooltip.setPos = (x, y) => {
            this.tooltip.xpos = x;
            this.tooltip.ypos = y;
        }

        this.tooltip.update = () => {
            const off_y = tooltip_container.clientHeight + 15;
            const off_x = -5;

            let posx = this.tooltip.xpos - off_x;
            let posy = this.tooltip.ypos - off_y;
            tooltip_container.style.left = posx + "px";
            tooltip_container.style.top  = posy + "px";
        }
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
        const len = this.skills.push(new SkillTab(element, game.skill_tree.get(id)));
        element.addEventListener("mouseover", () => this.hoverSkill(this.skills[len - 1].skill));
        element.addEventListener("mouseout", () => this.is_hovering = false);
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

    addSkillCell(key, skill, parent) {
        const new_skill = this.addSkill(key, skill.x, skill.y, skill.icon);

        if (parent) {
            let is_vertical = false;
            let x = skill.x;
            let y = skill.y;

            if (parent.skill.data.x === skill.x) {
                is_vertical = true;
                y = parent.skill.data.y + Math.sign(skill.y - parent.skill.data.y);
            }
            else {
                x = parent.skill.data.x + Math.sign(skill.x - parent.skill.data.x);
            }

            this.addConnection(x, y, is_vertical, new_skill);
        }

        if ("children" in skill) {
            for (const [id, child] of Object.entries(skill.children)) {
                this.addSkillCell(id, child, new_skill);
            }
        }
    }

    hoverSkill(skill) {
        this.is_hovering = true;
        this.tooltip.name.textContent = skill.name;
        this.tooltip.desc.textContent = skill.desc;
        this.tooltip.cost.replaceChildren();

        if (skill.finished_upgrading) {
            this.tooltip.desc.textContent = "Unlocked";
            return;
        }

        for (const [id, count] of Object.entries(skill.cost.resources)) {
            let has = game.inventory.countOf(id) >= count;
            ui.htmlFromStr(`
                <div class="tooltip-cost-item ${has ? "tooltip-cost-available" : ""}">
                    <div class="tooltip-cost-count">-${formatNumber(count)}</div>
                    <div class="tooltip-cost-name">${Resources.name(id)}</div>
                </div>
                `,
                this.tooltip.cost
            );
        }
        for (const [id, count] of Object.entries(skill.cost.pinpins)) {
            let has = game.village.countOf(id) >= count;
            ui.htmlFromStr(`
                <div class="tooltip-cost-item ${has ? "tooltip-cost-available" : ""}">
                    <div class="tooltip-cost-count">-${formatNumber(count)}</div>
                    <div class="tooltip-cost-name">${PinpinType.name(id)}</div>
                </div>
                `,
                this.tooltip.cost
            );
        }
    }

    onMouseMove(event) {
        if (!this.is_hovering) {
            this.tooltip.setVisibility(false);
            return;
        }

        this.tooltip.setPos(event.clientX, event.clientY);
        this.tooltip.update();
        this.tooltip.setVisibility(true);
    }

    /* overload */ 
    static getId() {
        return "skill-tree";
    }

    /* overload */ 
    onInit() {
        // this.show();
        addListener(MessageTypes.skillUnlocked, (skill) => {
            for (const item of this.skills) {
                item.update();
            }
            this.hoverSkill(skill);
            this.tooltip.update();
        })
    }

    /* overload */ 
    onSelected() {
        addEventListener("mousemove", this.onMouseMoveHandler);
    }

    /* overload */ 
    onExitSelected() {
        removeEventListener("mousemove", this.onMouseMoveHandler);
        this.is_hovering = false;
        this.onMouseMove();
    }
}