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

function createSequence(gearsPrimary: number[], gearsSecondary: number[], parameters: Task) {
    // gearsPrimary and gearsSecondary contain gears decided by the algorithm.
    // In addition to that, the result will contain the fixed start and end gear sequences set by the user.
    // There are three types of gear pairs: fixed and fixed, fixed and decided (at the end/beginning of an odd sized fixed sequence)
    // and pairs completely decided by the algorithm. Only th completely decided pairs can be reordered.
    
    // Add worm gears if needed
    while (gearsPrimary.length + parameters.fixedPrimary!.length < gearsSecondary.length + parameters.fixedSecondary!.length) {
        gearsPrimary.push(1);
    }
    while (gearsPrimary.length + parameters.fixedPrimary!.length > gearsSecondary.length + parameters.fixedSecondary!.length) {
        gearsSecondary.push(1);
    }

    // If fixed sequence is of odd length, one fixed gear will be paired with non-fixed gears
    if (parameters.startSequence.length % 2 == 1) {
        gearsPrimary.push(parameters.startSequence[parameters.startSequence.length - 1]);
    }
    if (parameters.endSequence.length % 2 == 1) {
        gearsSecondary.push(parameters.endSequence[0]);
    }
    var lastItemIndex = gearsPrimary.length - 1;

    // Run Munkres algorithm
    var matrix: Matrix = [];    
    for (var gear1 of gearsPrimary) {
        var row: number[] = [];
        for (var gear2 of gearsSecondary) {
            row.push(parameters.gearAssignmentCosts[gear1][gear2]);
        }
        matrix.push(row);
    }

    if (parameters.startSequence.length % 2 == 1 && parameters.endSequence.length % 2 == 1) {
        matrix[lastItemIndex][lastItemIndex] = Number.POSITIVE_INFINITY;
    }

    var munkres = new MunkresAlgorithm(matrix);
    var assignments = munkres.run();
    
    // Assemble sequence
    var sequenceStart: Array<[number, number]> = [];
    var sequenceReorderable: Array<[number, number]> = [];
    var sequenceEnd: Array<[number, number]> = [];

    for (var i = 0; i < parameters.startSequence.length - 1; i += 2) {
        sequenceStart.push([parameters.startSequence[i], parameters.startSequence[i + 1]]);
    }

    for (var [index1, index2] of assignments) {
        var gearPair: [number, number] = [gearsPrimary[index1], gearsSecondary[index2]];
        if (parameters.startSequence.length % 2 == 1 && index1 == lastItemIndex) {
            sequenceStart.push(gearPair); // append at the end
        } else if (parameters.endSequence.length % 2 == 1 && index2 == lastItemIndex) {
            sequenceEnd.push(gearPair); // insert at the start
        } else {
            sequenceReorderable.push(gearPair); // order doesn't matter here
        }
    }

    for (var i = parameters.endSequence.length % 2; i < parameters.endSequence.length; i += 2) {
        sequenceEnd.push([parameters.endSequence[i], parameters.endSequence[i + 1]]);
    }

    sequenceReorderable.sort(function (a, b) { return Math.sign(a[0] / a[1] - b[0] / b[1]); });
    
    var result: Connection[] = [];
    for (var [gear1, gear2] of sequenceStart.concat(sequenceReorderable, sequenceEnd)) {
        result.push(new Connection(gear1, gear2));
    }

    return result;
}