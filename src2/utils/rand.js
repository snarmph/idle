import { Resources } from "src/inventory.js"

export function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function randomCheck(value) {
    return Math.random() <= value;
}

export function randomCheckPercent(percent) {
    return Math.random() <= (percent * 0.01);
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

// TODO: this is from chat-gpt
export function gaussianRandom(mean, std_dev) {
    // Generate two random numbers from standard normal distribution (box-muller transform)
    let u1 = Math.random();
    let u2 = Math.random();
    
    // Use the Box-Muller transform to generate a standard normal random variable
    let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Scale and shift to match the mean and standard deviation
    return mean + z0 * std_dev;
}

export function randomEvent(chance, tries) {
    const expected_result = tries * chance;
    const standard_deviation = Math.sqrt(tries * chance * (1 - chance));
    
    // Use a normal distribution approximation with deviation
    // Generate a random value from a normal distribution (Gaussian distribution)
    const result = gaussianRandom(expected_result, standard_deviation);
    
    return Math.round(result);  
}