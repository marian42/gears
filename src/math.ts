type GearFactorsDict = {[gear: number]: number[]};

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function greatestCommonDenominator(a: number, b: number): number {
    if (b == 0) {
        return a;
    } else {
        return greatestCommonDenominator(b, a % b);
    }
}

function getOnCircle(angle: number, radius: number): [number, number] {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function isApproximatelyInteger(number: number) {
    return Math.abs(number - Math.round(number)) < 1e-8;
}

function factorize(number: number): number[] {
    var result: number[] = [];
    for (var i = 2; i <= number; i++) {
        var value = 0;
        while (number % i == 0) {
            value += 1;
            number /= i;
        }
        result.push(value);
    }
    return result;
}

function createBins(items: number[], itemToBin: (item: number) => number): {[bin: number]: number[]} {
    var result: {[bin: number]: number[]} = {};
    for (var item of items) {
        var bin = itemToBin(item);
        if (!(bin in result)) {
            result[bin] = [];
        }
        result[bin].push(item);
    }
    return result;
}

function getIndexOfBestMatch(gear: number, sequence: number[]) {
    for (var i = 0; i < sequence.length; i++) {
        if ((gear + sequence[i]) % 16 == 0) {
            return i;
        }
    }
    for (var i = 0; i < sequence.length; i++) {
        if ((gear + sequence[i]) % 8 == 0) {
            return i;
        }
    }
    for (var i = 0; i < sequence.length; i++) {
        if (sequence[i] % 8 != 0 && (sequence[i] + 12) % 8 != 0) {
            return i;
        }
    }
    return 0;
}