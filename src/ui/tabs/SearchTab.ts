///<reference path="../SolutionList.ts" />
///<reference path="./SearchParameters.ts" />

type Task = {
    targetRatio: Fraction;
    searchRatio: Fraction | null;
    error: number;
    startSequence: number[];
    endSequence: number[];
    exact: boolean;
    gears: number[];
    gearAssignmentCosts: GearAssignmentCostTable;
    distanceConstraint: number | null;
    id: number;
    maxNumberOfResults: number;
    excludePairsWithFixedGears: boolean;
    gearFactors: GearFactorsDict;
    fixedPrimary: number[] | null;
    fixedSecondary: number[] | null;
    solutionList: SolutionList | null;
    fixedPrimaryFactor: number | null;
    fixedSecondaryFactor: number | null;
};

type AnimationSettings = {
    enabled: boolean;
    duration: number;
}

class SearchParameters {
    public readonly targetRatio = new StringSearchParameter("3/4", "targetratio", "ratio");
    public readonly error = new CheckboxedSearchParameter(new NumberSearchParameter(0.01, "error", "error"), false, "approximate");
    public readonly gearDistance = new DistanceParameter(0.5, "dst");
    public readonly include2DConnections = new BooleanSearchParameter(true, "incl2d", "include2dconnectionscheckbox");
    public readonly standardGears = new CheckboxedSearchParameter(new GearListSearchParameter(STANDARD_GEARS, "gears", "standardgearslist"), true, "standardgearscheckbox");
    public readonly customGears = new CheckboxedSearchParameter(new GearListSearchParameter(DEFAULT_CUSTOM_GEARS, "customgears", "customgearslist"), false, "customgearscheckbox");
    public readonly startGears = new GearListSearchParameter([], "start", "fixedStart");
    public readonly endGears = new GearListSearchParameter([], "end", "fixedEnd");
    public readonly excludePairsWithFixedGears = new BooleanSearchParameter(false, "epwfg", "exlude-pairs-with-fixed-gears");
    public readonly limitCount = new NumberSearchParameter(30, "count", "limitCount");
    public readonly limitTime = new NumberSearchParameter(30, "time", "limitTime");

    private readonly items: SearchParameter<any>[] = [
        this.targetRatio,
        this.error,
        this.gearDistance,
        this.include2DConnections,
        this.standardGears,
        this.customGears,
        this.startGears,
        this.endGears,
        this.excludePairsWithFixedGears,
        this.limitCount,
        this.limitTime
    ];

    private readonly advancedParameters: SearchParameter<any>[] = [
        this.customGears,
        this.startGears,
        this.endGears,
        this.excludePairsWithFixedGears,
        this.limitCount,
        this.limitTime
    ];

    public applyUrlParametersToForm(parameters: ParsedUrlParameters) {
        for (let item of this.items) {
            item.setFromUrl(parameters);
        }
    }

    public getUrlParametersFromForm(): string {
        const parts: string[] = [];
        for (let item of this.items) {
            const part = item.getUrlKeyValuePairFromDOM();
            if (part !== null) {
                parts.push(part);
            }
        }
        if (this.targetRatio.getFromDOM() == this.targetRatio.defaultValue) {
            parts.push(this.targetRatio.urlKey + "=" + this.targetRatio.defaultValue);
        }
        return "?" + parts.join("&");
    }

    public advancedParametersUsed(parameters: ParsedUrlParameters): boolean {
        for (let item of this.advancedParameters) {
            if (!item.isDefault(parameters)) {
                return true;
            }
        }
        return false;
    }

    public applyDefaults() {
        for (let item of this.items) {
            item.setInDom(item.defaultValue);
        }
    }
}

type GearAssignmentCostTable = {[gear1: number]: {[gear2: number]: number}};

class SearchTab {
    private readonly resultDiv: HTMLDivElement;
    private readonly searchingSpan: HTMLSpanElement;

    private currentWorker: Worker | null = null;

    public currentTask: Task | null = null;
    private currentTaskId = 0;

    public animationSettings: AnimationSettings = { enabled: false, duration: 0 };

    private readonly animateCheckbox: HTMLInputElement;
    private readonly rpmTextbox: HTMLInputElement;

    private readonly searchParameters = new SearchParameters();

    constructor() {
        this.resultDiv = document.getElementById("result") as HTMLDivElement;
        this.searchingSpan = document.getElementById("searching") as HTMLSpanElement;
        this.animateCheckbox = document.getElementById('animate') as HTMLInputElement;
        this.rpmTextbox = document.getElementById('animate-rpm') as HTMLInputElement;
        this.updateAnimation();
        this.prepareEventListeners();
        this.searchParameters.applyDefaults();
    }

    private getAvailableGears(): number[] {
        let result: number[] = [];

        const standardGears = this.searchParameters.standardGears.getFromDOM();
        if (standardGears.checked) {
            result = result.concat(standardGears.value);
        }
    
        const customGears = this.searchParameters.customGears.getFromDOM();
        if (customGears.checked) {
            result = result.concat(customGears.value);
        }
    
        return result;
    }

    private onReceiveWorkerMessage(event: MessageEvent) {
        if (event.data.id == this.currentTaskId) {
            const connections = [];
            for (const [gear1, gear2] of event.data.sequence) {
                connections.push(new Connection(gear1, gear2));
            }
            this.currentTask!.solutionList!.add(new Solution(connections, this.currentTask!));

            if (this.currentTask!.solutionList!.totalSolutions >= this.currentTask!.maxNumberOfResults) {
                this.stopSearch();
            }
        }
    }

    private readFixedSequenceGears(currentTask: Task) {
        currentTask.startSequence = this.searchParameters.startGears.getFromDOM();
        currentTask.endSequence = this.searchParameters.endGears.getFromDOM();

        currentTask.fixedPrimary = [];
        currentTask.fixedSecondary = [];
        currentTask.fixedPrimaryFactor = 1;
        currentTask.fixedSecondaryFactor = 1;
        for (let i = 0; i < currentTask.startSequence.length; i++) {
            if (i % 2 == 0) {
                currentTask.fixedPrimary.push(currentTask.startSequence[i]);
                currentTask.fixedPrimaryFactor *= currentTask.startSequence[i];
            } else {
                currentTask.fixedSecondary.push(currentTask.startSequence[i]);
                currentTask.fixedSecondaryFactor *= currentTask.startSequence[i];
            }
        }
        for (let i = 0; i < currentTask.endSequence.length; i++) {
            if ((currentTask.endSequence.length - 1 - i) % 2 == 1) {
                currentTask.fixedPrimary.push(currentTask.endSequence[i]);
                currentTask.fixedPrimaryFactor *= currentTask.endSequence[i];
            } else {
                currentTask.fixedSecondary.push(currentTask.endSequence[i]);
                currentTask.fixedSecondaryFactor *= currentTask.endSequence[i];
            }
        }

        currentTask.searchRatio = currentTask.targetRatio.multiply(new Fraction(currentTask.fixedSecondaryFactor, currentTask.fixedPrimaryFactor));
    }

    private get2DFitCost(gear1: number, gear2: number): number {
        let targetDistance = (gear1 + gear2) / 16;
        if (gear1 == 140 || gear2 == 140) {
            targetDistance -= (gear1 + gear2 - 140) * 2 / 16;
        }

        const maxError = DEFAULT_FIT_ERROR / 8;

        let lowestCost = 0;

        for (let y = 0; y <= Math.ceil(targetDistance); y += 0.5) {
            const x = Math.round((Math.sqrt(Math.pow(targetDistance, 2) - Math.pow(y, 2))) / 0.5) * 0.5;
            if (x == 0 || y == 0 || Number.isNaN(x) || x < y) {
                continue;
            }

            const totalDistance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            const error = totalDistance - targetDistance;
            if (Math.abs(error) > maxError) {
                continue;
            }
            
            if (x % 1 == 0 && y % 1 == 0) {
                lowestCost = Math.min(lowestCost, ASSIGNMENT_COST_FULL_2D);
            } else if (x % 1 == 0 || y % 1 == 0) {
                lowestCost = Math.min(lowestCost, ASSIGNMENT_COST_HALF_FULL_2D);                
            } else {
                lowestCost = Math.min(lowestCost, ASSIGNMENT_COST_HALF_2D);
            }
        }
        return lowestCost;
    }

    private getGearAssignmentCosts(task: Task, include2DConnections: boolean): GearAssignmentCostTable {
        const result: GearAssignmentCostTable = {};
        const availableGears = task.gears.slice();

        if (task.startSequence.length % 2 == 1 && !availableGears.includes(task.startSequence[task.startSequence.length - 1])) {
            availableGears.push(task.startSequence[task.startSequence.length - 1]);
        }
        if (task.endSequence.length % 2 == 1 && !availableGears.includes(task.endSequence[0])) {
            availableGears.push(task.endSequence[0]);
        }

        for (const driverGear of availableGears) {
            result[driverGear] = {};

            for (const followerGear of availableGears) {
                let cost = 0;
                const totalTeeth = driverGear + followerGear;

                let violatesConstraint = (task.distanceConstraint == null) ? false : (totalTeeth % 16 * task.distanceConstraint) != 0; 

                if ((driverGear == 1 && followerGear == 1) || (driverGear == 140 && followerGear == 140)) {
                    cost = ASSIGNMENT_COST_FORBIDDEN;
                } else {
                    const distance = getGearDistance(driverGear, followerGear);
                    if (distance % 1 == 0) {
                        cost += ASSIGNMENT_COST_FULL_1D;
                        violatesConstraint = false;
                    } else if (distance % 0.5 == 0) {
                        cost += ASSIGNMENT_COST_HALF_1D;
                        if (task.distanceConstraint == 0.5) {
                            violatesConstraint = false;
                        }
                    }

                    if (gearsFitPerpendicularly(driverGear, followerGear)) {
                        cost += ASSIGNMENT_COST_PERPENDICULAR;
                    }

                    const assignmentCost2D = this.get2DFitCost(driverGear, followerGear);
                    cost += assignmentCost2D;

                    if (include2DConnections && assignmentCost2D == ASSIGNMENT_COST_FULL_2D) {
                        violatesConstraint = false;
                    } else if (include2DConnections && assignmentCost2D < 0 && task.distanceConstraint == 0.5) {
                        violatesConstraint = false;
                    } 
                }

                if (violatesConstraint) {
                    cost = ASSIGNMENT_COST_FORBIDDEN;
                }
                result[driverGear][followerGear] = cost;
            }
        }

        return result;
    }

    private handleTaskTimeout() {
        const taskId = this.currentTaskId;
        setTimeout(function(this: SearchTab) {
            if (this.currentTask!.id == taskId && this.currentWorker != null) {
                this.stopSearch();
            }
        }.bind(this), parseInt((document.getElementById('limitTime') as HTMLInputElement).value) * 1000);
    }

    private checkForMissingFactors(task: Task) {
        const availableFactors = getGearFactorsSet(task.gears, task.gearFactors!);
        const missingFactors = getMissingPrimeFactors(task.searchRatio!, availableFactors);
        if (missingFactors.length != 0) {
            this.resultDiv.innerText = '\nNo exact solution is available because these gears are missing:\n\n'
                + missingFactors.join('\n')
                + '\n\nConsider searching for approximate results.';
            return true;
        }
        return false;
    }

    private testSequence(sequence: OrderedGears, start: Fraction): [Fraction, string] {
        var result = "";
        var ratio = start;
        for (let [gear1, gear2] of sequence) {
            ratio = ratio.multiply(new Fraction(gear1, gear2));
            result += "G" + gear1 + ":G" + gear2 + " (" + ratio.a + " / " + ratio.b + ") -> ";
        }
        if (sequence.length == 0) {
            result = "no gears -> (" + ratio.a + " / " + ratio.b + ") ->";
        }
        return [ratio, result];
    }

    private testDifferential(task: Task) {
        console.log("test differential");
        var iterator = findSolutionsWithDifferential(task);

        for (var i = 0; i < 10; i++) {
            var unordered = iterator.next().value as UnorderedGearsWithDifferentials;
            console.log(unordered);
            var result = prepareResultWithDifferential(unordered, task);
            console.log(result);
            if (result != null) {
                var ratio = new Fraction(1);
                if (result.primaryLeft.length != 0 || result.secondaryLeft.length != 0) {
                    let [ratio1, line1] = this.testSequence(result.primaryLeft, ratio);
                    console.log(line1);
                    let [ratio2, line2] = this.testSequence(result.secondaryLeft, ratio);
                    console.log(line2);
                    ratio = ratio1.add(ratio2).divideByFactor(2);
                    console.log("differential -> " + ratio.a + " / " + ratio.b);
                }
                if (result.sharedSequence.length != 0) {
                    let [ratio1, line1] = this.testSequence(result.sharedSequence, ratio);
                    ratio = ratio1;
                    console.log(line1);
                }

                if (result.primaryRight.length != 0 || result.secondaryRight.length != 0) {
                    console.log("differential -> ");
                    var a = this.testSequence(result.primaryRight, new Fraction(1))[0];
                    var b = this.testSequence(result.secondaryRight, new Fraction(1))[0];
                    var offset = ratio.multiply(a).subtract(ratio.multiply(b)).divide(a.add(b));
                    var start1 = ratio.subtract(offset);
                    let [ratio1, line1] = this.testSequence(result.primaryRight, start1);
                    console.log("(" + start1.toString() + ") -> " + line1);
                    var start2 = ratio.add(offset);
                    let [ratio2, line2] = this.testSequence(result.secondaryRight, start2);
                    console.log("(" + start2.toString() + ") -> " + line2);
                }
                break;
            }
            console.log("\n\n");
        }
    }

    private startSearch() {
        const approximateSettings = this.searchParameters.error.getFromDOM() as CheckableValue<number>;        
        this.currentTaskId++;

        this.currentTask = {
            exact: !approximateSettings.checked,
            error: approximateSettings.value,
            targetRatio: Fraction.parse(this.searchParameters.targetRatio.getFromDOM()),
            gears: this.getAvailableGears(),
            gearAssignmentCosts: {},
            distanceConstraint: this.searchParameters.gearDistance.getFromDOM(),
            id: this.currentTaskId,
            maxNumberOfResults: this.searchParameters.limitCount.getFromDOM(),
            excludePairsWithFixedGears: this.searchParameters.excludePairsWithFixedGears.getFromDOM(),
            startSequence: [],
            endSequence: [],
            searchRatio: null,
            gearFactors: {},
            fixedPrimary: null,
            fixedSecondary: null,
            solutionList: null,
            fixedPrimaryFactor: null,
            fixedSecondaryFactor: null
        };
        
        for (const gear of this.currentTask.gears) {
            this.currentTask.gearFactors[gear] = factorize(gear);
        }

        this.readFixedSequenceGears(this.currentTask);

        this.currentTask.gearAssignmentCosts = this.getGearAssignmentCosts(this.currentTask, this.searchParameters.include2DConnections.getFromDOM());
        
        document.getElementById('resultcount')!.innerText = "0";
        document.getElementById('result-meta')!.style.display = 'block';
        document.getElementById('smallest-error-container')!.style.display = this.currentTask.exact ? 'none' : 'inline';
        document.getElementById('smallest-error')!.innerText = '';

        if (this.currentWorker != null) {
            this.currentWorker.terminate();
        }

        this.testDifferential(this.currentTask);

        if (this.checkForMissingFactors(this.currentTask)) {
            return;
        }

        /*
        this.currentWorker = new Worker("app.js");
        this.currentWorker.onmessage = this.onReceiveWorkerMessage.bind(this);
        this.currentWorker.postMessage(this.currentTask);

        this.searchingSpan.style.display = "inline";
        this.currentTask.solutionList = new SolutionList(this.resultDiv, this.currentTask);
        this.handleTaskTimeout();
        */
    }

    public stopSearch() {
        if (this.currentWorker != null) {
            this.currentWorker.terminate();
            this.currentWorker = null;
        }

        this.searchingSpan.style.display = "none";
    }
    
    private prepareEventListeners() {    
        document.getElementById('calculate')!.addEventListener('click', function(this: SearchTab, event: MouseEvent) {
            event.preventDefault();
            
            this.startSearch();

            window.history.pushState({}, "", this.getUrlParameters());
        }.bind(this));

        document.getElementById('stop')!.addEventListener('click', function(this: SearchTab, event: MouseEvent) {
            event.preventDefault();
            this.stopSearch();        
        }.bind(this));

        this.animateCheckbox.addEventListener('change', this.updateAnimation.bind(this));
        this.rpmTextbox.addEventListener('change', this.updateAnimation.bind(this));
    }

    getUrlParameters(): string {
        return this.searchParameters.getUrlParametersFromForm();
    }
    
    loadUrlParameters(parameters: ParsedUrlParameters) {
        this.searchParameters.applyUrlParametersToForm(parameters);
        
        if (this.searchParameters.advancedParametersUsed(parameters)) {
            (document.getElementById("advanced-options") as HTMLDetailsElement).open = true;
        }

        this.startSearch();
    }

    updateAnimation() {
        this.animationSettings.enabled = this.animateCheckbox.checked;
        this.animationSettings.duration = 60 / parseFloat(this.rpmTextbox.value);

        if (this.currentTask != null) {
            this.currentTask.solutionList!.updateAnimation();
        }
    }
}