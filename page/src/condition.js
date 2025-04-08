import { game } from "src/game.js"

export class Condition {
    constructor(condition, consequence = null) {
        this.condition = condition;
        this.consequence = consequence;
        this.is_unlocked = false;
    }

    step() {
        if (!this.is_unlocked && this.condition()) {
            this.is_unlocked = true;
            if (this.consequence !== null) {
                this.consequence();
            }
            return true;
        }
        return this.is_unlocked;
    }

    setConsequence(consequence) {
        this.consequence = consequence;
    }

    unlocked() {
        return this.is_unlocked;
    }

    reset() {
        this.is_unlocked = false;
    }
}

export class ResourceCondition extends Condition {
    constructor(resources, on_unlocked = null, check_total = false) {
        super(
            () => {
                for (const [k, v] of Object.entries(resources)) {
                    if (check_total) {
                        if (game.inventory.totalOf(k) < v) {
                            return false;
                        }
                    } 
                    else {
                        if (game.inventory.countOf(k) < v) {
                            return false;
                        }
                    }
                }
                return true;
            },
            on_unlocked
        )
    }
}

export class SkillCondition extends Condition {
    constructor(key, on_unlocked) {
        super(
            () => this.skill_unlocked,
            () => on_unlocked(game.skill_tree.get(key))
        );
        this.skill_unlocked = false;
        game.skill_tree.watchSkill(key, () => {
            this.skill_unlocked = true;
            if (this.step()) {
                const skill = game.skill_tree.get(key);
                if (!skill.finished_upgrading) {
                    this.reset();
                }
            }
        });
    }
}