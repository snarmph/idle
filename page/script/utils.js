import { Resources } from "script/enums.js"

export function lerp(v0, v1, alpha) {
    return (1 - alpha) * v0 + alpha * v1;
}

export function makeEnum(list) {
    let obj = {
        _list: [],
        *[Symbol.iterator]() {
            for (let i = 0; i < this._list.length; ++i) {
                yield [i, this._list[i]];
            }
        },
    };
    for (let i = 0; i < list.length; ++i) {
        obj[list[i]] = i;
        obj._list[i] = list[i];
    }
    obj["fromIndex"] = (index) => {
        return obj._list[index];
    };
    return Object.freeze(obj);
}

export function makeNamedEnum(list) {
    class NamedEnum {
        constructor(list) {
            this._list = [];

            for (let i = 0; i < list.length; ++i) {
                let item = list[i];
                this[item[0]] = i;
                this._list[i] = item;
            }
        }

        each() {
            let obj = this;
            return {
                *[Symbol.iterator]() {
                    for (let i = 0; i < obj._list.length; ++i) {
                        yield [i, obj._list[i]];
                    }
                }
            }
        }

        fromIndex(index) {
            return this._list[index];
        }

        name(index) {
            return this._list[index][1];
        }
    };
    return Object.freeze(new NamedEnum(list));
}

export function makeObjectEnum(object) {
    class ObjEnum {
        constructor(object) {
            this._list = [];
            this._keys = [];
            
            let i = 0;
            for (const [k, v] of Object.entries(object)) {
                this[k] = i;
                this._list[i] = v;
                this._keys[i] = k;
                ++i;
            }
        }

        each() {
            let obj = this;
            return {
                *[Symbol.iterator]() {
                    for (let i = 0; i < obj._list.length; ++i) {
                        yield [i, obj._list[i]];
                    }
                }
            }
        }

        fromIndex(index) {
            return this._list[index];
        }

        key(value) {
            return this._keys[value];
        }

        get(index, name, def_value = undefined) {
            let obj = this._list[index];
            return name in obj ? obj[name] : def_value;
        }

        name(index) {
            return this.get(index, "name");
        }

        count() {
            return this._list.length
        }
    }

    return Object.freeze(new ObjEnum(object));
}

export function isElementVisible(elem) {
    return !elem.classList.contains("hidden");
}

export function makeVisible(elem) {
    elem.classList.remove("hidden");
}

export function makeInvisible(elem) {
    elem.classList.add("hidden");
}

export function toMilliseconds(seconds) {
    return seconds * 1000.0;
}

export function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function randomCheck(value) {
    return Math.random() >= value;
}

export function randomCheckPercent(percent) {
    return Math.random() >= (percent * 0.01);
}

export function randomResources(probabilities) {
    let out = {
        _results: [],
    };
    out["getResults"] = () => {
        return out._results;
    };
    for (const [id, prob] of Object.entries(probabilities)) {
        const always_one = !("max" in prob);
        const min = "min" in prob ? prob.min : 0;
        const max = !always_one ? prob.max : 1;
        let count = min;

        let passed = true;
        if ("atleast" in prob) {
            passed = randomCheckPercent(prob.atleast);
        }
        if (passed) {
            if (always_one) {
                count = 1;
            }
            else {
                count = getRandomInt(min, max);
            }
        }

        if (count === 0) continue;

        const res = Resources.fromIndex(id);

        let result = {
            id: id,
            name: res.name,
            count: count,
        };
        
        if (count === 1 && "singular" in res) {
            result.name = res.singular;
        }

        out[Resources.key(id)] = count;
        out._results.push(result);
    }
    return out;
}

export function randomItem(arr) {
    return arr[getRandomInt(0, arr.length)];
}

export function forEachCond(arr) {
    for (let i = 0; i < arr.length; ++i) {
        arr[i].step();
        if (arr[i].unlocked()) {
            arr[i] = arr[arr.length - 1];
            arr.pop();
            --i;
        }
    }
}

export function formatNumber(num) {
    if (Number.isInteger(num)) {
        return String(num);
    }
    else {
        return num.toFixed(2);
    }
}