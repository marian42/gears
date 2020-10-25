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
    var sequenceStart: Connection[] = [];
    for (var i = 0; i < parameters.startSequence.length - 1; i += 2) {
        sequenceStart.push(new Connection(parameters.startSequence[i], parameters.startSequence[i + 1]));
    }
    if (parameters.startSequence.length % 2 == 1) {
        var lastStartSequenceGear = parameters.startSequence[parameters.startSequence.length - 1];
        if (gearsSecondary.length == 0) {
            sequenceStart.push(new Connection(lastStartSequenceGear, 1));
        } else {
            var index = getIndexOfBestMatch(lastStartSequenceGear, gearsSecondary);
            sequenceStart.push(new Connection(lastStartSequenceGear, gearsSecondary[index]));
            gearsSecondary = gearsSecondary.slice();
            gearsSecondary.splice(index, 1);
        }
    }
    var sequenceEnd: Connection[] = [];
    if (parameters.endSequence.length % 2 == 1) {
        var firstEndSequenceGear = parameters.endSequence[0];
        if (gearsPrimary.length == 0) {
            sequenceStart.push(new Connection(1, firstEndSequenceGear));
        } else {
            var index = getIndexOfBestMatch(firstEndSequenceGear, gearsPrimary);
            sequenceEnd.push(new Connection(gearsPrimary[index], firstEndSequenceGear));
            gearsPrimary = gearsPrimary.slice();
            gearsPrimary.splice(index, 1);
        }
    }
    for (var i = parameters.endSequence.length % 2; i < parameters.endSequence.length; i += 2) {
        sequenceEnd.push(new Connection(parameters.endSequence[i], parameters.endSequence[i + 1]));
    }

    var binsPrimary = createBins(gearsPrimary, function (gear) { return gear % 16; });
    var binsSecondary = createBins(gearsSecondary, function (gear) { return (16 - gear % 16) % 16; });
    var remainderPrimary: number[] = [];
    var remainderSecondary: number[] = [];
    var connections: Connection[] = [];

    for (var i = 0; i < 16; i++) {
        if (!(i in binsPrimary) && !(i in binsSecondary)) {
            continue;
        }
        if (!(i in binsPrimary)) {
            remainderSecondary = remainderSecondary.concat(binsSecondary[i]);
        } else if (!(i in binsSecondary)) {
            remainderPrimary = remainderPrimary.concat(binsPrimary[i]);
        } else {
            const n = Math.min(binsPrimary[i].length, binsSecondary[i].length);
            for (var j = 0; j < n; j++) {
                connections.push(new Connection(binsPrimary[i][j], binsSecondary[i][j]));
            }
            remainderPrimary = remainderPrimary.concat(binsPrimary[i].slice(n));
            remainderSecondary = remainderSecondary.concat(binsSecondary[i].slice(n));
        }
    }

    var binsPrimary = createBins(remainderPrimary, function (gear) { return gear % 8; });
    var binsSecondary = createBins(remainderSecondary, function (gear) { return (8 - gear % 8) % 8; });
    remainderPrimary = [];
    remainderSecondary = [];

    for (var i = 0; i < 8; i++) {
        if (!(i in binsPrimary) && !(i in binsSecondary)) {
            continue;
        }
        if (!(i in binsPrimary)) {
            remainderSecondary = remainderSecondary.concat(binsSecondary[i]);
        } else if (!(i in binsSecondary)) {
            remainderPrimary = remainderPrimary.concat(binsPrimary[i]);
        } else {
            const n = Math.min(binsPrimary[i].length, binsSecondary[i].length);
            for (var j = 0; j < n; j++) {
                connections.push(new Connection(binsPrimary[i][j], binsSecondary[i][j]));
            }
            remainderPrimary = remainderPrimary.concat(binsPrimary[i].slice(n));
            remainderSecondary = remainderSecondary.concat(binsSecondary[i].slice(n));
        }
    }

    for (var i = 0; i < Math.max(remainderPrimary.length, remainderSecondary.length); i++) {
        connections.push(new Connection(i < remainderPrimary.length ? remainderPrimary[i] : 1, i < remainderSecondary.length ? remainderSecondary[i] : 1))
    }

    connections.sort(function (a, b) { return Math.sign(a.factor - b.factor); });

    return sequenceStart.concat(connections, sequenceEnd);
}