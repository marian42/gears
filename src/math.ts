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
    const result: number[] = [];
    for (let i = 2; i <= number; i++) {
        let value = 0;
        while (number % i == 0) {
            value += 1;
            number /= i;
        }
        result.push(value);
    }
    return result;
}