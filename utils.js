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
            console.log(index);
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