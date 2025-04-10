import * as enums from "src/utils/enum.js"

export const Resources = enums.make({
    wood: {
        name: "wood",
    },
    seeds: {
        name: "seeds",
    },
    wheat: {
        name: "wheat",
    },
    stone: {
        name: "stone",
    },
})

export class Resource {
    constructor(id, count, total) {
        this.id = id;
        this.count = count;
        this.total = total;
    }

    add(n) {
        this.total += n;
        this.count += n;
    }

    rem(n) {
        this.count -= n;
    }
}

export class Inventory {
    constructor() {
        this.resources = [];
        for (const [id, _] of Resources.each()) {
            this.resources.push(new Resource(id, 0, 0));
        }
    }

    add(id, n) {
        this.resources[id].add(n);
    }

    rem(id, n) {
        this.resources[id].rem(n);
    }

    hasEnough(resources) {
        if (!resources) return true;
        for (const [id, count] of Object.entries(resources)) {
            if (this.resources[id].count < count) {
                return false;
            }
        }
        return true;
    }

    addMultiple(resources) {
        if (!resources) return true;
        for (const [id, count] of Object.entries(resources)) {
            this.add(id, count);
        }
    }

    removeMultiple(resources) {
        if (!resources) return true;
        for (const [id, count] of Object.entries(resources)) {
            this.rem(id, count);
        }
    }

    countOf(id) {
        return this.resources[id].count;
    }

    totalOf(id) {
        return this.resources[id].total;
    }

    count() {
        let total = 0;
        for (const res of this.resources) {
            total += res.count;
        }
        return total;
    }

    get(id) {
        return this.resources[id];
    }
}