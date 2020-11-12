type UnorderedGears = [number[], number[]]; // Can have different number of primary and secondary gears, matching undecided
type OrderedGears = Array<[number, number]>; // Same number of primary and secondary gears, matching decided

function getGearProduct(domain: number[], gearCounts: number[]) {
    let result = 1;
    for (let i = 0; i < domain.length; i++) {
        result *= Math.pow(domain[i], gearCounts[i]);
    }
    return result;
}

// Converts the domain + counts representation to a list of actual gears (that includes duplicates)
function getGears(domain: number[], gearCounts: number[]): number[] {
    const result = [];
    for (let i = 0; i < domain.length; i++) {
        for (let j = 0; j < gearCounts[i]; j++) {
            result.push(domain[i]);
        }
    }
    return result;
}

function getGearFactorsSet(gears: number[], gearFactors: GearFactorsDict): Set<number> {
    const gearFactorsSet: Set<number> = new Set();
    for (const gear of gears) {
        for (let i = 0; i < gearFactors[gear].length; i++) {
            if (gearFactors[gear][i] > 0) {
                gearFactorsSet.add(i + 2);
            }
        }
    }
    return gearFactorsSet;
}

// Returns an iterator over all numbers that can be made with the given factors
function* getHammingSequence(bases: number[]) {
    const queues: {[base: number]: number[]} = {};
    for (const base of bases) {
        queues[base] = [];
    }
    let nextResult = 1;
    while (true) {
        yield nextResult;
        
        for (const base in queues) {

            queues[base].push(nextResult * Number.parseInt(base))
        }

        let smallestNextQueueItem: number | null = null;

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

// Returns a list of gear multisets that can be made with availableGears and have a teeth product equal to target
function findGears(target: number, availableGears: number[], gearFactors: GearFactorsDict): number[][] {
    if (target == 1) {
        return [[]];
    }

    const targetFactors = factorize(target);

    const domain: number[] = []; // Gears used, will be a subset of availableGears, indices will refer to the order in this array.
    const gearMaxCounts: number[] = [];
    const availableFactors: Set<number> = new Set();

    // Use prime factors to determine an upper bound of usage count for each gear.
    // Example: If the target contains the prime factor 2 four times (ie is divisible by 2^4),
    // a gear that contains the prime factor 2 only twice (ie. is divisible by 2^2, but not by 2^3),
    // can be used at most twice. Similarly, if a gear has a prime factor that isn't present
    // in the target, it can't be used at all.
    for (const gear of availableGears) {
        const factors = gearFactors[gear];
        if (factors.length > targetFactors.length) {
            continue;
        }
        let maxOccurances: number | null = null;
        for (let i = 0; i < factors.length; i++) {
            if (factors[i] == 0) {
                continue;
            }
            const maxOccurancesThisFactor = Math.floor(targetFactors[i] / factors[i]);
            if (maxOccurances === null || maxOccurancesThisFactor < maxOccurances) {
                maxOccurances = maxOccurancesThisFactor;
            }
            if (maxOccurances == 0) {
                break;
            }
        }
        if (maxOccurances! > 0) {
            domain.push(gear);
            gearMaxCounts.push(maxOccurances!);
            for (let i = 0; i < factors.length; i++) {
                if (factors[i] != 0) {
                    availableFactors.add(i);
                }
            }
        }
    }

    for (let i = 0; i < targetFactors.length; i++) {
        if (targetFactors[i] != 0 && !availableFactors.has(i)) {
            // The target number contains prime factors that are not in any of the available gears.
            return [];
        }
    }

    const gearCounts = Array(domain.length).fill(0);
    const result = [];

    while (true) {
        const teethProduct = getGearProduct(domain, gearCounts);
        if (teethProduct == target) {
            result.push(getGears(domain, gearCounts));
        }

        gearCounts[0] += 1;
        let position = 0;
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


function* findGearSequences(searchRatio: Fraction, availableGears: number[], availableGearsPrimary: number[], availableGearsSecondary: number[], gearFactors: GearFactorsDict): Generator<UnorderedGears, void, null> {
    const availableFactors = getGearFactorsSet(availableGears, gearFactors);
    const hammingIterator = getHammingSequence(Array.from(availableFactors));

    while (true) {
        const currentRatio = searchRatio.extend(hammingIterator.next().value as number);

        const solutionsPrimary = findGears(currentRatio.a, availableGearsPrimary, gearFactors);

        if (solutionsPrimary.length == 0) {
            continue;
        }
        for (const solutionPrimary of solutionsPrimary) {
            const solutionsSecondary = findGears(currentRatio.b, availableGearsSecondary.filter(gear => !solutionPrimary.includes(gear)), gearFactors);
            for (const solutionSecondary of solutionsSecondary) {
                yield [solutionPrimary, solutionSecondary];
            }
        }
    }
}

function* findSolutionsExact(parameters: Task): Generator<UnorderedGears, void, null> {
    if (parameters.excludePairsWithFixedGears) {
        var availableGearsPrimary = parameters.gears.filter(gear => !parameters.fixedSecondary!.includes(gear));
        var availableGearsSecondary = parameters.gears.filter(gear => !parameters.fixedPrimary!.includes(gear));
    } else {
        var availableGearsPrimary = parameters.gears;
        var availableGearsSecondary = parameters.gears;
    }

    const iterator = findGearSequences(parameters.searchRatio!, parameters.gears, availableGearsPrimary, availableGearsSecondary, parameters.gearFactors);

    while (true) {
        yield iterator.next().value as UnorderedGears;
    }
}

function* findSolutionsApproximate(parameters: Task): Generator<UnorderedGears, void, null> {
    const targetRatio = parameters.searchRatio!.getDecimal();
    
    if (parameters.excludePairsWithFixedGears) {
        var availableGearsPrimary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedSecondary!.includes(gear));
        var availableGearsSecondary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedPrimary!.includes(gear));
    } else {
        var availableGearsPrimary = parameters.gears.filter(gear => gear != 1);
        var availableGearsSecondary = availableGearsPrimary;
    }
    
    const hammingIterator = getHammingSequence(availableGearsPrimary);
    while (true) {
        const primaryValue = hammingIterator.next().value as number;
        const solutionsPrimary = findGears(primaryValue, availableGearsPrimary, parameters.gearFactors!);

        if (solutionsPrimary.length == 0) {
            continue;
        }

        const denominatorMin = Math.ceil(primaryValue / targetRatio * (1.0 - parameters.error));
        const denominatorMax = Math.floor(primaryValue / targetRatio * (1.0 + parameters.error));
        
        if (denominatorMin > denominatorMax) {
            continue;
        }
        
        for (const solutionPrimary of solutionsPrimary) {
            const remainingGears = availableGearsSecondary.filter(gear => !solutionPrimary.includes(gear));

            for (let secondaryValue = denominatorMin; secondaryValue <= denominatorMax; secondaryValue++) {
                const solutionsSecondary = findGears(secondaryValue, remainingGears, parameters.gearFactors!);
                for (const solutionSecondary of solutionsSecondary) {
                    yield [solutionPrimary, solutionSecondary];
                }
            }
        }
    }
}

function prepareResult(unorderedGears: UnorderedGears, parameters: Task): OrderedGears | null {
    // gearsPrimary and gearsSecondary contain gears decided by the algorithm.
    // In addition to that, the result will contain the fixed start and end gear sequences set by the user.
    // There are three types of gear pairs: fixed and fixed, fixed and decided (at the end/beginning of an odd sized fixed sequence)
    // and pairs completely decided by the algorithm. Only th completely decided pairs can be reordered.
    
    var [gearsPrimary, gearsSecondary] = unorderedGears;

    if ((!parameters.gears.includes(1) && gearsPrimary.length + parameters.fixedPrimary!.length != gearsSecondary.length + parameters.fixedSecondary!.length)
    || (parameters.excludePairsWithFixedGears && parameters.fixedPrimary!.includes(1) && gearsPrimary.length + parameters.fixedPrimary!.length > gearsSecondary.length + parameters.fixedSecondary!.length)
    || (parameters.excludePairsWithFixedGears && parameters.fixedSecondary!.includes(1) && gearsPrimary.length + parameters.fixedPrimary!.length < gearsSecondary.length + parameters.fixedSecondary!.length)) {
        return null;
    }

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
    const lastItemIndex = gearsPrimary.length - 1;

    // Run Munkres algorithm
    const costMatrix: Matrix = [];    
    for (const gear1 of gearsPrimary) {
        const row: number[] = [];
        for (const gear2 of gearsSecondary) {
            row.push(parameters.gearAssignmentCosts[gear1][gear2]);
        }
        costMatrix.push(row);
    }

    if (parameters.startSequence.length % 2 == 1 && parameters.endSequence.length % 2 == 1) {
        costMatrix[lastItemIndex][lastItemIndex] = ASSIGNMENT_COST_FORBIDDEN;
    }

    const munkres = new MunkresAlgorithm(costMatrix);
    const assignments = munkres.run();
    
    // Assemble sequence
    const sequenceStart: OrderedGears = [];
    const sequenceReorderable: OrderedGears = [];
    const sequenceEnd: OrderedGears = [];

    for (let i = 0; i < parameters.startSequence.length - 1; i += 2) {
        sequenceStart.push([parameters.startSequence[i], parameters.startSequence[i + 1]]);
    }

    for (const [index1, index2] of assignments) {
        if (costMatrix[index1][index2] == ASSIGNMENT_COST_FORBIDDEN) {
            return null;
        }
        const gearPair: [number, number] = [gearsPrimary[index1], gearsSecondary[index2]];
        if (parameters.startSequence.length % 2 == 1 && index1 == lastItemIndex) {
            sequenceStart.push(gearPair); // append at the end
        } else if (parameters.endSequence.length % 2 == 1 && index2 == lastItemIndex) {
            sequenceEnd.push(gearPair); // insert at the start
        } else {
            sequenceReorderable.push(gearPair); // order doesn't matter here
        }
    }

    for (let i = parameters.endSequence.length % 2; i < parameters.endSequence.length; i += 2) {
        sequenceEnd.push([parameters.endSequence[i], parameters.endSequence[i + 1]]);
    }

    sequenceReorderable.sort(function (a, b) { return Math.sign(a[0] / a[1] - b[0] / b[1]); });
    
    return sequenceStart.concat(sequenceReorderable, sequenceEnd);
}

self.onmessage = function(event: MessageEvent) {
    const task = event.data as Task;
    task.targetRatio = new Fraction(task.targetRatio!.a, task.targetRatio!.b);
    task.searchRatio = new Fraction(task.searchRatio!.a, task.searchRatio!.b);
    
    let useDifferentials = false;
    if (task.exact) {
        const availableFactors = getGearFactorsSet(task.gears, task.gearFactors!);
        useDifferentials = !canBeMadeWithFactors(task.searchRatio.a, availableFactors) || !canBeMadeWithFactors(task.searchRatio.b, availableFactors);
    }
    
    if (useDifferentials) {
        let iterator = findSolutionsWithDifferential(task);

        while (true) {
            const unorderedGears = iterator.next().value as UnorderedGearsWithDifferentials;            
            const orderedGears = prepareResultWithDifferential(unorderedGears, task);
            
            if (orderedGears != null) {
                const workerGlobalContext: Worker = self as any;
                workerGlobalContext.postMessage({
                    id: task.id,
                    sequence: orderedGears,
                    usesDifferential: true
                });
            }
        }
    } else {
        let iterator = task.exact ? findSolutionsExact(task) : findSolutionsApproximate(task);
    
        while (true) {
            const unorderedGears = iterator.next().value as UnorderedGears;            
            const orderedGears = prepareResult(unorderedGears, task);
            
            if (orderedGears != null) {
                const workerGlobalContext: Worker = self as any;
                workerGlobalContext.postMessage({
                    id: task.id,
                    sequence: orderedGears,
                    usesDifferential: false
                });
            }
        }
    }
}