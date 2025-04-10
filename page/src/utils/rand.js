import { Resources } from "src/inventory.js"

// TODO: this is from chat-gpt, maybe understand wtf is happening?
function gaussian(mean, std_dev) {
    // Generate two random numbers from standard normal distribution (box-muller transform)
    let u1 = Math.random();
    let u2 = Math.random();
    
    // Use the Box-Muller transform to generate a standard normal random variable
    let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Scale and shift to match the mean and standard deviation
    return mean + z0 * std_dev;
}

export function int(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

export function check(norm_value) {
    return Math.random() <= norm_value;
}

export function percent(percent) {
    return Math.random() <= (percent * 0.01);
}

export function choose(arr) {
    return arr[int(0, arr.length)];
}

export function event(chance, tries) {
    const expected_result = tries * chance;
    const standard_deviation = Math.sqrt(tries * chance * (1 - chance));
    
    // Use a normal distribution approximation with deviation
    // Generate a random value from a normal distribution (Gaussian distribution)
    const result = gaussian(expected_result, standard_deviation);
    
    return Math.round(result); 
}

export function loot(probabilities) {
    let results = [];
    let out = {
        getResults: () => {
            return results;
        }
    };
    for (const [id, prob] of Object.entries(probabilities)) {
        const always_one = !("max" in prob);
        const min = "min" in prob ? prob.min : 0;
        const max = !always_one ? prob.max : 1;
        let count = min;

        let passed = true;
        if ("atleast" in prob) {
            passed = percent(100 - prob.atleast);
        }

        if (passed) {
            count = always_one ? 1 : int(min, max);
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
        results.push(result);
    }
    return out;
}