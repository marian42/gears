function getTeethProduct(gearTeeth: number[], gearCounts: number[]) {
    var result = 1;
    for (var i = 0; i < gearTeeth.length; i++) {
        result *= Math.pow(gearTeeth[i], gearCounts[i]);
    }
    return result;
}

function getResult(gearTeeth: number[], gearCounts: number[]): number[] {
    var result = [];
    for (var i = 0; i < gearTeeth.length; i++) {
        for (var j = 0; j < gearCounts[i]; j++) {
            result.push(gearTeeth[i]);
        }
    }
    return result;
}

function getMissingPrimeFactors(targetRatio: Fraction, availableFactors: number[]) {
    var result = [];
    var numeratorFactors = factorize(targetRatio.a);
    for (var i = 0; i < numeratorFactors.length; i++) {
        if (numeratorFactors[i] > 0 && !availableFactors.includes(i + 2)) {
            result.push(i + 2);
        }
    }
    var denominatorFactors = factorize(targetRatio.b);
    for (var i = 0; i < denominatorFactors.length; i++) {
        if (denominatorFactors[i] > 0 && !availableFactors.includes(i + 2)) {
            result.push(i + 2);
        }
    }
    return result;
}

function getGearFactorsSet(gears: number[], gearFactors: GearFactorsDict) {
    var gearFactorsSet: Set<number> = new Set();
    for (var gear of gears) {
        for (var i = 0; i < gearFactors[gear].length; i++) {
            if (gearFactors[gear][i] > 0) {
                gearFactorsSet.add(i + 2);
            }
        }
    }
    return Array.from(gearFactorsSet.values());
}

// Returns an iterator over all numbers that can be made with the given factors
function* getHammingSequence(bases: number[]) {
    var queues: {[base: number]: number[]} = {};
    for (var base of bases) {
        queues[base] = [];
    }
    var nextResult = 1;
    while (true) {
        yield nextResult;
        
        for (const base in queues) {

            queues[base].push(nextResult * Number.parseInt(base))
        }

        var smallestNextQueueItem: number | null = null;

        for (const base in queues) {
            if (smallestNextQueueItem == null || queues[base][0] < smallestNextQueueItem) {
                smallestNextQueueItem = queues[base][0];
            }
        }

        nextResult = smallestNextQueueItem!;
 
        for (const base in queues) {
            if (queues[base][0] == nextResult) {
                queues[base].shift();
            }
        }
    }
}

function findGears(target: number, availableGears: number[], gearFactors: GearFactorsDict): number[][] {
    const targetFactors = factorize(target);

    var gearTeeth: number[] = [];
    var gearMaxCounts: number[] = [];
    var availableFactors: Set<number> = new Set();

    for (var gear of availableGears) {
        const factors = gearFactors[gear];
        if (factors.length > targetFactors.length) {
            continue;
        }
        var maxOccurances: number | null = null;
        for (var i = 0; i < factors.length; i++) {
            if (factors[i] == 0) {
                continue;
            }
            var maxOccurancesThisFactor = Math.floor(targetFactors[i] / factors[i]);
            if (maxOccurances === null || maxOccurancesThisFactor < maxOccurances) {
                maxOccurances = maxOccurancesThisFactor;
            }
            if (maxOccurances == 0) {
                break;
            }
        }
        if (maxOccurances! > 0) {
            gearTeeth.push(gear);
            gearMaxCounts.push(maxOccurances!);
            for (var i = 0; i < factors.length; i++) {
                if (factors[i] != 0) {
                    availableFactors.add(i);
                }
            }
        }
    }

    for (var i = 0; i < targetFactors.length; i++) {
        if (targetFactors[i] != 0 && !availableFactors.has(i)) {
            // The target number contains prime factors that are not in any of the available gears.
            return [];
        }
    }

    var gearCounts = Array(gearTeeth.length).fill(0);
    var result = [];

    while (true) {
        var teethProduct = getTeethProduct(gearTeeth, gearCounts);
        if (teethProduct == target) {
            result.push(getResult(gearTeeth, gearCounts));
        }

        gearCounts[0] += 1;
        var position = 0;
        while (true) {
            if (gearCounts[position] <= gearMaxCounts[position]) {
                break;
            }
            gearCounts[position] = 0;
            if (position == gearCounts.length - 1) {
                return result;
            }
            position += 1;
            gearCounts[position] += 1;
        }
    }
}

function* findSolutionsExact(parameters: Task): Generator<[number[], number[]], void, null> {    
    var availableFactors = getGearFactorsSet(parameters.gears, parameters.gearFactors!);

    if (parameters.excludePairsWithFixedGears) {
        var availableGearsPrimary = parameters.gears.filter(gear => !parameters.fixedSecondary!.includes(gear));
        var availableGearsSecondary = parameters.gears.filter(gear => !parameters.fixedPrimary!.includes(gear));
    } else {
        var availableGearsPrimary = parameters.gears;
        var availableGearsSecondary = parameters.gears;    
    }
    
    var missingFactors = getMissingPrimeFactors(parameters.searchRatio!, availableFactors);
    if (missingFactors.length != 0) {
        const workerGlobalContext: Worker = self as any;
        workerGlobalContext.postMessage({
            id: parameters.id,
            type: 'stop',
            reason: 'missingfactors',
            missingFactors: missingFactors
        });
        close();
        return;
    }

    var hammingIterator = getHammingSequence(availableFactors);
    while (true) {
        var currentRatio = parameters.searchRatio!.extend(hammingIterator.next().value as number);

        var solutionsPrimary = findGears(currentRatio.a, availableGearsPrimary, parameters.gearFactors!);

        if (solutionsPrimary.length == 0) {
            continue;
        }
        for (var solutionPrimary of solutionsPrimary) {
            var solutionsSecondary = findGears(currentRatio.b, availableGearsSecondary.filter(gear => !solutionPrimary.includes(gear)), parameters.gearFactors!);
            for (var solutionSecondary of solutionsSecondary) {
                yield [solutionPrimary, solutionSecondary];
            }
        }
    }
}

function* findSolutionsApproximate(parameters: Task): Generator<[number[], number[]], void, null> {
    var targetRatio = parameters.searchRatio!.getDecimal();
    
    if (parameters.excludePairsWithFixedGears) {
        var availableGearsPrimary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedSecondary!.includes(gear));
        var availableGearsSecondary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedPrimary!.includes(gear));
    } else {
        var availableGearsPrimary = parameters.gears.filter(gear => gear != 1);
        var availableGearsSecondary = availableGearsPrimary;
    }
    
    var hammingIterator = getHammingSequence(availableGearsPrimary);
    while (true) {
        var primaryValue = hammingIterator.next().value as number;
        var solutionsPrimary = findGears(primaryValue, availableGearsPrimary, parameters.gearFactors!);

        if (solutionsPrimary.length == 0) {
            continue;
        }

        var denominatorMin = Math.ceil(primaryValue / targetRatio * (1.0 - parameters.error));
        var denominatorMax = Math.floor(primaryValue / targetRatio * (1.0 + parameters.error));
        
        if (denominatorMin > denominatorMax) {
            continue;
        }
        
        for (var solutionPrimary of solutionsPrimary) {
            var remainingGears = availableGearsSecondary.filter(gear => !solutionPrimary.includes(gear));

            for (var secondaryValue = denominatorMin; secondaryValue <= denominatorMax; secondaryValue++) {
                var solutionsSecondary = findGears(secondaryValue, remainingGears, parameters.gearFactors!);
                for (var solutionSecondary of solutionsSecondary) {
                    yield [solutionPrimary, solutionSecondary];
                }
            }
        }
    }
}

type ResultCandidate = {
    sequence: Array<[number, number]>,
    valid: boolean
}

function prepareResult(gearsPrimary: number[], gearsSecondary: number[], parameters: Task): ResultCandidate {
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
    var costMatrix: Matrix = [];    
    for (var gear1 of gearsPrimary) {
        var row: number[] = [];
        for (var gear2 of gearsSecondary) {
            row.push(parameters.gearAssignmentCosts[gear1][gear2]);
        }
        costMatrix.push(row);
    }

    if (parameters.startSequence.length % 2 == 1 && parameters.endSequence.length % 2 == 1) {
        costMatrix[lastItemIndex][lastItemIndex] = ASSIGNMENT_COST_FORBIDDEN;
    }

    var munkres = new MunkresAlgorithm(costMatrix);
    var assignments = munkres.run();
    
    // Assemble sequence
    var sequenceStart: Array<[number, number]> = [];
    var sequenceReorderable: Array<[number, number]> = [];
    var sequenceEnd: Array<[number, number]> = [];

    for (var i = 0; i < parameters.startSequence.length - 1; i += 2) {
        sequenceStart.push([parameters.startSequence[i], parameters.startSequence[i + 1]]);
    }
    
    var validSolution = true;

    for (var [index1, index2] of assignments) {
        if (costMatrix[index1][index2] == ASSIGNMENT_COST_FORBIDDEN) {
            validSolution = false;
        }
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
    
    return {
        sequence: sequenceStart.concat(sequenceReorderable, sequenceEnd),
        valid: validSolution
    };
}


self.onmessage = function(event: MessageEvent) {
    var parameters = event.data as Task;
    parameters.targetRatio = new Fraction(parameters.targetRatio!.a, parameters.targetRatio!.b);
    parameters.searchRatio = new Fraction(parameters.searchRatio!.a, parameters.searchRatio!.b);

    parameters.gearFactors = {};
    for (var gear of parameters.gears) {
        parameters.gearFactors[gear] = factorize(gear);
    }
    var wormGearAvailable = parameters.gears.includes(1);

    var iterator = parameters.exact ? findSolutionsExact(parameters) : findSolutionsApproximate(parameters);

    while (true) {
        var candidate = iterator.next().value as [number[], number[]];

        var solutionPrimary = candidate[0];
        var solutionSecondary = candidate[1];

        if (!wormGearAvailable && solutionPrimary.length + parameters.fixedPrimary!.length != solutionSecondary.length + parameters.fixedSecondary!.length) {
            continue;
        }

        var resultCandidate = prepareResult(solutionPrimary, solutionSecondary, parameters);
        
        if (resultCandidate.valid) {
            const workerGlobalContext: Worker = self as any;
            workerGlobalContext.postMessage({
                id: parameters.id,
                type: 'solution',
                sequence: resultCandidate.sequence
            });
        }
    }
}