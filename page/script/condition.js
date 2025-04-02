import { game } from "script/game.js"

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
        return false;
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
    constructor(resources, onUnlocked = null, checkTotal = false) {
        super(
            () => {
                for (const [k, v] of Object.entries(resources)) {
                    const res = game.inventory.getResource(k);
                    if (res === null) {
                        return false;
                    }

                    if (checkTotal) {
                        if (res.getTotal() < v) {
                            return false;
                        }
                    }
                    else if (res.get() < v) {
                        return false;
                    }
                }
                return true;
            },
            onUnlocked
        );
    }
}

export class ItemCondition extends Condition {
    constructor(items, onUnlocked = null) {
        super(
            () => {
                for (const [k, v] of Object.entries(items)) {
                    if (game.inventory.getItem(k).upgrade < v) {
                        return false;
                    }
                    return true;
                }
            },
            onUnlocked
        );
    }
}