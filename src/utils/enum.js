export function makeEnum(object) {
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