///<reference path="./worker.ts" />

type UnorderedGearsWithDifferentials = {
    left1: number[],
    left2: number[],
    right1: number[],
    right2: number[]
};

type OrderedGearsWithDifferentials = { 
    primaryLeft: OrderedGears,
    secondaryLeft: OrderedGears,
    sharedSequence: OrderedGears,
    primaryRight: OrderedGears,
    secondaryRight: OrderedGears
 }

 function findGearsCached(target: number, availableGears: number[], gearFactors: GearFactorsDict, cache: {[target: number]: number[][]}): number[][] {
    if (target in cache) {
        return cache[target];
    }

    cache[target] = findGears(target, availableGears, gearFactors);
    return cache[target];
}


function canBeMadeWithFactors(target: number, availableFactors: Set<number>): boolean {
    const requiredFactors = factorize(target);
    for (var i = 0; i < requiredFactors.length; i++) {
        if (requiredFactors[i] > 0 && !availableFactors.has(i + 2)) {
            return false;
        }
    }
    return true;
}

function* getCombinations(count1: number, count2: number, count3: number, count4: number): Generator<[number, number, number, number], void, undefined> {
    for (var index1 = 0; index1 < count1; index1++) {
        for (var index2 = 0; index2 < count2; index2++) {
            for (var index3 = 0; index3 < count3; index3++) {
                for (var index4 = 0; index4 < count4; index4++) {
                    yield [index1, index2, index3, index4];
                }
            }
        }
    }
}

function* findSolutionsWithDifferential(task: Task): Generator<UnorderedGearsWithDifferentials, void, null> {
    var primaryTarget = task.searchRatio!.a;
    var secondaryTarget = task.searchRatio!.b;
    const availableFactors = getGearFactorsSet(task.gears, task.gearFactors!);
    const hammingIterator = getHammingSequence(Array.from(availableFactors));
    const wormGearAvailable = task.gears.includes(1);

    const usePrimaryDifferential = !canBeMadeWithFactors(primaryTarget, availableFactors);
    const useSecondaryDifferential = !canBeMadeWithFactors(secondaryTarget, availableFactors);

    const findGearsCache: {[target: number]: number[][]} = {};

    while (true) {
        const extension = hammingIterator.next().value as number;

        var offsets: Array<[number, number]> = [];
        for (var totalOffset = 0; totalOffset < Math.max(primaryTarget, secondaryTarget) * extension; totalOffset++) {
            if (!usePrimaryDifferential) {
                offsets.push([0, totalOffset]);
            } else if (!useSecondaryDifferential) {
                offsets.push([totalOffset, 0])
            } else {
                for (var primaryOffset = 0; primaryOffset <= totalOffset; primaryOffset++) {
                    offsets.push([primaryOffset, totalOffset - primaryOffset]);
                }
            }
        }

        for (let [primaryOffset, secondaryOffset] of offsets) {
            const left1 = Math.abs(primaryTarget * extension - primaryOffset);
            const left2 = primaryTarget * extension + primaryOffset;

            const right1 = Math.abs(secondaryTarget * extension - secondaryOffset);
            const right2 = secondaryTarget * extension + secondaryOffset;

            if (left1 <= 0 || right1 <= 0) {
                // The = 0 case isn't needed, the differential would act as a * 1/2 step
                // The < 0 case can be useful, but needs special handling (TODO)
                continue;
            }

            if (!canBeMadeWithFactors(left1, availableFactors)
                || !canBeMadeWithFactors(left2, availableFactors)
                || !canBeMadeWithFactors(right1, availableFactors)
                || !canBeMadeWithFactors(right2, availableFactors)) {
                continue;
            }

            const gearsLeft1 = findGearsCached(left1, task.gears, task.gearFactors, findGearsCache);
            if (gearsLeft1.length == 0) {
                continue;
            }

            const gearsLeft2 = findGearsCached(left2, task.gears, task.gearFactors, findGearsCache);

            if (gearsLeft2.length == 0) {
                continue;
            }

            const gearsRight1 = findGearsCached(right1, task.gears, task.gearFactors, findGearsCache);
            if (gearsRight1.length == 0) {
                continue;
            }

            const gearsRight2 = findGearsCached(right2, task.gears, task.gearFactors, findGearsCache);
            if (gearsRight2.length == 0) {
                continue;
            }

            const combinationsIterator = getCombinations(gearsLeft1.length, gearsLeft2.length, gearsRight1.length, gearsRight2.length);

            for (let [indexLeft1, indexLeft2, indexRight1, indexRight2] of combinationsIterator) {
                if ((primaryOffset == 0 && indexLeft1 != indexLeft2) || (secondaryOffset == 0 && indexRight1 != indexRight2)) {
                    // Prevent adding a differential when we could do without one
                    continue;
                }

                var maxGearCount = Math.max(gearsLeft1[indexLeft1].length, gearsLeft2[indexLeft2].length, gearsRight1[indexRight1].length, gearsRight2[indexRight2].length);
                if ((gearsLeft1[indexLeft1].length < maxGearCount || gearsLeft2[indexLeft2].length < maxGearCount)
                    && (gearsRight1[indexRight1].length < maxGearCount || gearsRight2[indexRight2].length < maxGearCount)) {
                        // This solution will require primary and secondary worm gears, not feasible!
                    continue;
                }

                if (!wormGearAvailable && (gearsLeft1[indexLeft1].length < maxGearCount || gearsLeft2[indexLeft2].length < maxGearCount || gearsRight1[indexRight1].length < maxGearCount || gearsRight2[indexRight2].length < maxGearCount)) {
                    // If the worm gear isn't available, all sequences must be of the same length, we can't fill the up with worm gears. 
                    continue;
                }

                let containsRedundantGear = false;
                for (let gear of gearsLeft1[indexLeft1]) {
                    if (gearsLeft2[indexLeft2].includes(gear) && gearsRight1[indexRight1].includes(gear) && gearsRight2[indexRight2].includes(gear)) {
                        containsRedundantGear = true;
                        break;
                    }
                }
                if (containsRedundantGear) {
                    continue;
                }
                
                yield {
                    left1: gearsLeft1[indexLeft1],
                    left2: gearsLeft2[indexLeft2],
                    right1: gearsRight1[indexRight1],
                    right2: gearsRight2[indexRight2]
                };
            }
        }
    }
}

function getMostCommonGear(value: UnorderedGearsWithDifferentials): number {
    var candidates = new Set<number>(value.left1.concat(value.left2, value.right1, value.right2));

    var bestGear = 0;
    var bestOccurances = 0;

    for (const candidate of candidates) {
        let occurances = (value.left1.includes(candidate) ? 1 : 0)
        + (value.left2.includes(candidate) ? 1 : 0)
        + (value.right1.includes(candidate) ? 1 : 0)
        + (value.right2.includes(candidate) ? 1 : 0);
        if (occurances > bestOccurances) {
            bestOccurances = occurances;
            bestGear = candidate;
        }
    }
    return bestGear;
}

function removeFromArray(array: number[], itemToRemove: number) {
    if (array.includes(itemToRemove)) {
        array.splice(array.indexOf(itemToRemove), 1);
    }
}

function removeOne(gear: number, value: UnorderedGearsWithDifferentials) {
    removeFromArray(value.left1, gear);
    removeFromArray(value.left2, gear);
    removeFromArray(value.right1, gear);
    removeFromArray(value.right2, gear);
}

function removeEqualPairs(sequence: UnorderedGears) {
    for (var i = 0; i < sequence[0].length; ) {
        if (sequence[1].includes(sequence[0][i])) {
            removeFromArray(sequence[1], sequence[0][i]);
            sequence[0].splice(i, 1);
        } else {
            i++;
        }
    }
}

function getSharedGears(list1: number[], list2: number[]): number[] {
    var result = [];
    list2 = list2.slice();
    for (var item of list1) {
        if (list2.includes(item)) {
            result.push(item);
            list2.splice(list2.indexOf(item), 1);
        }
    }
    return result;
}

function moveSharedPairs(primarySequence: UnorderedGears, secondarySequence: UnorderedGears, sharedSequence: UnorderedGears) {
    // Pairs of gears that appear in both "arms" of the differential gear will be moved to the shared sequence so that they appear only once.
    
    var sharedPrimaryGears = getSharedGears(primarySequence[0], secondarySequence[0]);
    var sharedSecondaryGears = getSharedGears(primarySequence[1], secondarySequence[1]);

    // TODO pick gears that fit well together
    for (var i = 0; i < Math.min(sharedPrimaryGears.length, sharedSecondaryGears.length); i++) {
        removeFromArray(primarySequence[0], sharedPrimaryGears[i]);
        removeFromArray(secondarySequence[0], sharedPrimaryGears[i]);
        removeFromArray(primarySequence[1], sharedSecondaryGears[i]);
        removeFromArray(secondarySequence[1], sharedSecondaryGears[i]);
        sharedSequence[0].push(sharedPrimaryGears[i]);
        sharedSequence[1].push(sharedSecondaryGears[i]);
    }

    if (primarySequence[0].length > primarySequence[1].length && secondarySequence[0].length > secondarySequence[1].length && sharedPrimaryGears.length > sharedSecondaryGears.length) {
        for (var i = sharedSecondaryGears.length; i < sharedPrimaryGears.length; i++) {
            removeFromArray(primarySequence[0], sharedPrimaryGears[i]);
            removeFromArray(secondarySequence[0], sharedPrimaryGears[i]);
            sharedSequence[0].push(sharedPrimaryGears[i]);
        }
    }

    if (primarySequence[0].length < primarySequence[1].length && secondarySequence[0].length < secondarySequence[1].length && sharedPrimaryGears.length < sharedSecondaryGears.length) {
        for (var i = sharedPrimaryGears.length; i < sharedSecondaryGears.length; i++) {
            removeFromArray(primarySequence[1], sharedSecondaryGears[i]);
            removeFromArray(secondarySequence[1], sharedSecondaryGears[i]);
            sharedSequence[1].push(sharedSecondaryGears[i]);
        }
    }
}

function prepareResultWithDifferential(unorderedGears: UnorderedGearsWithDifferentials, task: Task): OrderedGearsWithDifferentials | null {
    // create a copy to modify

    var remaining = {
        left1: unorderedGears.left1.slice(),
        left2: unorderedGears.left2.slice(),
        right1: unorderedGears.right1.slice(),
        right2: unorderedGears.right2.slice()
    };

    const gearsRequired = Math.max(unorderedGears.left1.length, unorderedGears.left2.length, unorderedGears.right1.length, unorderedGears.right2.length);

    const gearsToAdd = [];
    for (var i = 0; i < gearsRequired; i++) {
        const gear = getMostCommonGear(remaining);
        gearsToAdd.push(gear);
        removeOne(gear, remaining);
    }

    var primaryLeft: UnorderedGears = [unorderedGears.left1.slice(), gearsToAdd.slice()];
    var secondaryLeft: UnorderedGears = [unorderedGears.left2.slice(), gearsToAdd.slice()];
    var primaryRight: UnorderedGears = [gearsToAdd.slice(), unorderedGears.right1.slice()];
    var secondaryRight: UnorderedGears = [gearsToAdd.slice(), unorderedGears.right2.slice()];
    var sharedSequence: UnorderedGears = [[], []];

    removeEqualPairs(primaryLeft);
    removeEqualPairs(secondaryLeft);
    moveSharedPairs(primaryLeft, secondaryLeft, sharedSequence);

    var orderedPrimaryLeft = prepareResult(primaryLeft, task);
    if (orderedPrimaryLeft == null) {
        return null;
    }

    var orderedSecondaryLeft = prepareResult(secondaryLeft, task);
    if (orderedSecondaryLeft == null) {
        return null;
    }

    removeEqualPairs(primaryRight);
    removeEqualPairs(secondaryRight);
    moveSharedPairs(primaryRight, secondaryRight, sharedSequence);

    var orderedPrimaryRight = prepareResult(primaryRight, task);
    if (orderedPrimaryRight == null) {
        return null;
    }

    var orderedSecondaryRight = prepareResult(secondaryRight, task);
    if (orderedSecondaryRight == null) {
        return null;
    }
    var orderedShared = prepareResult(sharedSequence, task);
    if (orderedShared == null) {
        return null;
    }

    return { 
        primaryLeft: orderedPrimaryLeft,
        secondaryLeft: orderedSecondaryLeft,
        sharedSequence: orderedShared,
        primaryRight: orderedPrimaryRight,
        secondaryRight: orderedSecondaryRight
    }
}
