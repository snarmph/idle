import * as enums from "src/utils/enum.js"

export function lerp(v0, v1, alpha) {
    return (1 - alpha) * v0 + alpha * v1;
}

let num_formats_long = [" thousand"," million"," billion"," trillion"," quadrillion"," quintillion"," sextillion"," septillion"," octillion"," nonillion"];
let num_prefixes = ["","un","duo","tre","quattuor","quin","sex","septen","octo","novem"];
let num_suffixes = ["decillion","vigintillion","trigintillion","quadragintillion","quinquagintillion","sexagintillion","septuagintillion","octogintillion","nonagintillion"];
for (const s of num_suffixes) {
	for (const p of num_prefixes) {
		num_formats_long.push(" " + p + s);
	}
}

let num_formats_short=["k","M","B","T","Qa","Qi","Sx","Sp","Oc","No"];
num_prefixes=["","Un","Do","Tr","Qa","Qi","Sx","Sp","Oc","No"];
num_suffixes=["D","V","T","Qa","Qi","Sx","Sp","O","N"];
for (const s of num_suffixes) {
	for (const p of num_prefixes) {
		num_formats_short.push(" " + p + s);
	}
}
num_formats_short[10]="Dc";

function formatRaw(num) {
    if (Number.isInteger(num)) {
        return String(num);
    }
    else {
        return num.toFixed(2);
    }
}

function formatScientific(num) {
    if (num < 1000) {
        return formatRaw(num);
    }
    return num.toExponential(2).replace("+", "");
}

function formatEveryThirdPower(notations) {
	return (value) => {
		let base = 0;
		let notation_value = "";
		if (!isFinite(value)) {
            return "Infinity";
        }
		if (value >= 10_000) {
			value *= 0.001;
			while(Math.round(value) >= 1000) {
			    value *= 0.001;
				base++;
			}
			if (base >= notations.length) {
                return "Infinity";
            } 
            else {
                notation_value = notations[base];
            }
		}
		return formatRaw(value) + notation_value;
	};
}

export const NumFormatting = enums.make({
    short: {
        name: "Short format",
        func: formatEveryThirdPower(num_formats_short),
    },
    long: {
        name: "Long format",
        func: formatEveryThirdPower(num_formats_long),
    },
    raw: {
        name: "Raw format",
        func: formatRaw,
    },
    scientific: {
        name: "Scientific format",
        func: formatScientific,
    }
})

let num_format_type = NumFormatting.short;
let num_formatter = NumFormatting.fromIndex(num_format_type);

export function setFormatter(index) {
    num_format_type = index;
    num_formatter = NumFormatting.fromIndex(num_format_type);
}

export function getFormatter() {
    return num_format_type;
}

export function format(num) {
    return num_formatter.func(num);
}

export function formatCount(num) {
    return (num > 0 ? "+" : "") + formatNumber(num);
}