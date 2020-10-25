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
    distanceConstraint: number | null;
    id: number;
    maxNumberOfResults: number;
    excludePairsWithFixedGears: boolean;
    gearFactors: GearFactorsDict | null;
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
        for (var item of this.items) {
            item.setFromUrl(parameters);
        }
    }

    public getUrlParametersFromForm(): string {
        var parts: string[] = [];
        for (var item of this.items) {
            var part = item.getUrlKeyValuePairFromDOM();
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
        for (var item of this.advancedParameters) {
            if (!item.isDefault(parameters)) {
                return true;
            }
        }
        return false;
    }

    public applyDefaults() {
        for (var item of this.items) {
            item.setInDom(item.defaultValue);
        }
    }
}

function parseGearList(value: string, distinct=false): number[] {
    var result: number[] = [];
    for (var gearString of value.split(',')) {
        gearString = gearString.trim();
        var teethCount = parseInt(gearString);
        if (!isNaN(teethCount) && (!distinct || !result.includes(teethCount))) {
            result.push(teethCount);
        }
    }
    return result;
}

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
        var result: number[] = [];

        var standardGears = this.searchParameters.standardGears.getFromDOM();
        if (standardGears.checked) {
            result = result.concat(standardGears.value);
        }
    
        var customGears = this.searchParameters.customGears.getFromDOM();
        if (customGears.checked) {
            result = result.concat(customGears.value);
        }
    
        return result;
    }

    private onReceiveWorkerMessage(event: MessageEvent) {
        if (event.data.type == 'solution' && event.data.id == this.currentTaskId) {
            var sequence = createSequence(event.data.gearsPrimary, event.data.gearsSecondary, this.currentTask!);
            this.currentTask!.solutionList!.add(new Solution(sequence, this.currentTask!));

            if (this.currentTask!.solutionList!.totalSolutions >= this.currentTask!.maxNumberOfResults) {
                this.stopSearch();
            }
        }
        if (event.data.type == 'stop' && event.data.id == this.currentTaskId) {
            this.searchingSpan.style.display = 'none';
            this.currentWorker = null;

            if (event.data.reason == 'missingfactors') {
                this.resultDiv.innerText = '\nNo exact solution is available because these gears are missing:\n\n'
                + event.data.missingFactors.join('\n')
                + '\n\nConsider searching for approximate results.';
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
        for (var i = 0; i < currentTask.startSequence.length; i++) {
            if (i % 2 == 0) {
                currentTask.fixedPrimary.push(currentTask.startSequence[i]);
                currentTask.fixedPrimaryFactor *= currentTask.startSequence[i];
            } else {
                currentTask.fixedSecondary.push(currentTask.startSequence[i]);
                currentTask.fixedSecondaryFactor *= currentTask.startSequence[i];
            }
        }
        for (var i = 0; i < currentTask.endSequence.length; i++) {
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

    private handleTaskTimeout() {
        var taskId = this.currentTaskId;
        setTimeout(function(this: SearchTab) {
            if (this.currentTask!.id == taskId && this.currentWorker != null) {
                this.stopSearch();
            }
        }.bind(this), parseInt((document.getElementById('limitTime') as HTMLInputElement).value) * 1000);
    }

    private startSearch() {
        var approximateSettings = this.searchParameters.error.getFromDOM() as CheckableValue<number>;        
        this.currentTaskId++;        

        this.currentTask = {
            exact: !approximateSettings.checked,
            error: approximateSettings.value,
            targetRatio: Fraction.parse(this.searchParameters.targetRatio.getFromDOM()),
            gears: this.getAvailableGears(),
            distanceConstraint: this.searchParameters.gearDistance.getFromDOM(),
            id: this.currentTaskId,
            maxNumberOfResults: this.searchParameters.limitCount.getFromDOM(),
            excludePairsWithFixedGears: this.searchParameters.excludePairsWithFixedGears.getFromDOM(),
            startSequence: [],
            endSequence: [],
            searchRatio: null,
            gearFactors: null,
            fixedPrimary: null,
            fixedSecondary: null,
            solutionList: null,
            fixedPrimaryFactor: null,
            fixedSecondaryFactor: null
        };

        this.readFixedSequenceGears(this.currentTask);

        if (this.currentWorker != null) {
            this.currentWorker.terminate();
        }

        this.currentWorker = new Worker("app.js");
        this.currentWorker.onmessage = this.onReceiveWorkerMessage.bind(this);
        this.currentWorker.postMessage(this.currentTask);

        this.searchingSpan.style.display = "inline";
        this.currentTask.solutionList = new SolutionList(this.resultDiv, this.currentTask);
        this.handleTaskTimeout();

        document.getElementById('resultcount')!.innerText = "0";
        document.getElementById('result-meta')!.style.display = 'block';
        document.getElementById('smallest-error-container')!.style.display = this.currentTask.exact ? 'none' : 'inline';
        document.getElementById('smallest-error')!.innerText = '';
    }

    private stopSearch() {
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
    
    loadUrlParameters(runSearch=true) {
        var parameters: ParsedUrlParameters = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m: string, key: string, value: string) {
            parameters[key] = decodeURI(value);
            return '';
        });

        if ("seq" in parameters) {
            var gearStrings = parameters["seq"].split(',');
            var gears = [];
            for (var gearString of gearStrings) {
                var gear = parseInt(gearString.trim());
                if (Number.isInteger(gear)) {
                    gears.push(gear);
                }
            }
            if (gears.length > 0) {
                sequenceEditor.setSequence(gears);
                (document.getElementById('tab-edit') as HTMLInputElement).checked = true;
                return;
            }
        }
    
        if ("targetratio" in parameters) {
            (document.getElementById('tab-search') as HTMLInputElement).checked = true;
            
            this.searchParameters.applyUrlParametersToForm(parameters);
            if (this.searchParameters.advancedParametersUsed(parameters)) {
                (document.getElementById("advanced-options") as HTMLDetailsElement).open = true;
            }
    
            if (runSearch) {
                this.startSearch();
            } else {
                this.resultDiv.innerText = '';
            }
        }
    }

    updateAnimation() {
        this.animationSettings.enabled = this.animateCheckbox.checked;
        this.animationSettings.duration = 60 / parseFloat(this.rpmTextbox.value);

        if (this.currentTask != null) {
            this.currentTask.solutionList!.updateAnimation();
        }
    }
}