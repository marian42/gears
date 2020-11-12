"use strict";
var State;
(function (State) {
    State[State["None"] = 0] = "None";
    State[State["Starred"] = 1] = "Starred";
    State[State["Primed"] = 2] = "Primed";
})(State || (State = {}));
// Munkres Algorithm aka Hungarian Algorithm based on https://brc2.com/the-algorithm-workshop/
class MunkresAlgorithm {
    constructor(costMatrix) {
        this.matrix = [];
        for (const row of costMatrix) {
            this.matrix.push(row.slice());
        }
        this.size = this.matrix.length;
        this.rowsCovered = [];
        this.columnsCovered = [];
        for (let i = 0; i < this.size; i++) {
            this.rowsCovered.push(false);
            this.columnsCovered.push(false);
        }
        this.path = [];
        for (let i = 0; i < this.size * 2; i++) {
            this.path.push([0, 0]);
        }
        this.zero0 = [0, 0];
        this.state = new Array(this.size);
        for (let i = 0; i < this.size; i++) {
            this.state[i] = new Array(this.size);
            for (let j = 0; j < this.size; j++) {
                this.state[i][j] = State.None;
            }
        }
    }
    ;
    run() {
        let nextStep = 1;
        const stepImplementations = [
            this.step1,
            this.step2,
            this.step3,
            this.step4,
            this.step5,
            this.step6
        ];
        while (nextStep != -1) {
            nextStep = stepImplementations[nextStep - 1].apply(this);
        }
        const selectedIndices = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.state[i][j] == State.Starred) {
                    selectedIndices.push([i, j]);
                }
            }
        }
        return selectedIndices;
    }
    step1() {
        for (let i = 0; i < this.size; i++) {
            const rowMinimum = Math.min.apply(Math, this.matrix[i]);
            for (let j = 0; j < this.size; j++) {
                this.matrix[i][j] -= rowMinimum;
            }
        }
        return 2;
    }
    ;
    step2() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.matrix[i][j] == 0 && !this.rowsCovered[i] && !this.columnsCovered[j]) {
                    this.state[i][j] = State.Starred;
                    this.rowsCovered[i] = true;
                    this.columnsCovered[j] = true;
                    break;
                }
            }
        }
        this.resetCovered();
        return 3;
    }
    ;
    step3() {
        let count = 0;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.state[i][j] == State.Starred && this.columnsCovered[j] == false) {
                    this.columnsCovered[j] = true;
                    count++;
                }
            }
        }
        if (count >= this.size) {
            return -1;
        }
        else {
            return 4;
        }
    }
    ;
    step4() {
        while (true) {
            let [row, column] = this.findAZero();
            if (row < 0) {
                return 6;
            }
            this.state[row][column] = State.Primed;
            const starredColumn = this.findStarInRow(row);
            if (starredColumn >= 0) {
                column = starredColumn;
                this.rowsCovered[row] = true;
                this.columnsCovered[column] = false;
            }
            else {
                this.zero0 = [row, column];
                return 5;
            }
        }
    }
    ;
    step5() {
        let count = 0;
        this.path[count][0] = this.zero0[0];
        this.path[count][1] = this.zero0[1];
        let done = false;
        while (!done) {
            const row = this.findStarInColumn(this.path[count][1]);
            if (row >= 0) {
                count++;
                this.path[count][0] = row;
                this.path[count][1] = this.path[count - 1][1];
            }
            else {
                done = true;
            }
            if (!done) {
                const column = this.findPrimeInRow(this.path[count][0]);
                count++;
                this.path[count][0] = this.path[count - 1][0];
                this.path[count][1] = column;
            }
        }
        this.convertPath(count);
        this.resetCovered();
        this.resetPrimes();
        return 3;
    }
    ;
    step6() {
        const smallestUncovered = this.findSmallestUncovered();
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.rowsCovered[i]) {
                    this.matrix[i][j] += smallestUncovered;
                }
                if (!this.columnsCovered[j]) {
                    this.matrix[i][j] -= smallestUncovered;
                }
            }
        }
        return 4;
    }
    ;
    findSmallestUncovered() {
        let result = ASSIGNMENT_COST_FORBIDDEN;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.rowsCovered[i] && !this.columnsCovered[j] && result > this.matrix[i][j]) {
                    result = this.matrix[i][j];
                }
            }
        }
        return result;
    }
    ;
    findAZero() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.matrix[i][j] == 0 && !this.rowsCovered[i] && !this.columnsCovered[j]) {
                    return [i, j];
                }
            }
        }
        return [-1, -1];
    }
    ;
    findStarInRow(row) {
        for (let j = 0; j < this.size; j++) {
            if (this.state[row][j] == State.Starred) {
                return j;
            }
        }
        return -1;
    }
    ;
    findStarInColumn(column) {
        for (let i = 0; i < this.size; i++) {
            if (this.state[i][column] == State.Starred) {
                return i;
            }
        }
        return -1;
    }
    ;
    findPrimeInRow(row) {
        for (let j = 0; j < this.size; j++) {
            if (this.state[row][j] == State.Primed) {
                return j;
            }
        }
        return -1;
    }
    ;
    convertPath(count) {
        for (let i = 0; i <= count; i++) {
            const [x, y] = this.path[i];
            this.state[x][y] = (this.state[x][y] == State.Starred) ? State.None : State.Starred;
        }
    }
    ;
    resetCovered() {
        for (let i = 0; i < this.size; i++) {
            this.rowsCovered[i] = false;
            this.columnsCovered[i] = false;
        }
    }
    ;
    resetPrimes() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.state[i][j] == State.Primed) {
                    this.state[i][j] = State.None;
                }
            }
        }
    }
    ;
}
class SolutionList {
    constructor(container, task) {
        this.solutions = {};
        this.sizeContainers = {};
        this.totalSolutions = 0;
        this.smallestError = null;
        this.container = container;
        this.container.textContent = '';
        this.task = task;
    }
    add(solution) {
        const count = solution.numberOfGears;
        if (!(count in this.solutions)) {
            const sizeContainer = document.createElement('div');
            const headline = document.createElement('h2');
            headline.innerText = 'Solutions with ' + count + " gears";
            sizeContainer.appendChild(headline);
            let done = false;
            for (let i = count - 1; i > 0; i--) {
                if (i in this.sizeContainers) {
                    this.container.insertBefore(sizeContainer, this.sizeContainers[i].nextSibling);
                    done = true;
                    break;
                }
            }
            if (!done) {
                this.container.insertBefore(sizeContainer, this.container.firstChild);
            }
            this.sizeContainers[count] = sizeContainer;
            this.solutions[count] = [];
        }
        if (this.task.exact) {
            this.sizeContainers[count].appendChild(solution.createDiv());
            this.solutions[count].push(solution);
        }
        else {
            let inserted = false;
            for (let i = 0; i < this.solutions[count].length; i++) {
                if (this.solutions[count][i].error > solution.error) {
                    this.sizeContainers[count].insertBefore(solution.createDiv(), this.solutions[count][i].domObject);
                    this.solutions[count].splice(i, 0, solution);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                this.sizeContainers[count].appendChild(solution.createDiv());
                this.solutions[count].push(solution);
            }
        }
        this.totalSolutions++;
        document.getElementById('resultcount').innerText = this.totalSolutions.toString();
        if (!this.task.exact && (this.smallestError === null || solution.error < this.smallestError)) {
            this.smallestError = solution.error;
            document.getElementById('smallest-error').innerText = this.smallestError.toPrecision(3);
        }
    }
    updateAnimation(rotationsPerSecond) {
        for (const count in this.solutions) {
            for (const solution of this.solutions[count]) {
                solution.updateAnimation(rotationsPerSecond);
            }
        }
    }
}
class SearchParameter {
    constructor(defaultValue, urlKey) {
        this.defaultValue = defaultValue;
        this.urlKey = urlKey;
    }
    getUrlKeyValuePairFromDOM() {
        const value = this.getFromDOM();
        if (JSON.stringify(value) == JSON.stringify(this.defaultValue)) {
            return null;
        }
        else {
            return this.urlKey + "=" + this.toString(value);
        }
    }
    setFromUrl(urlParameters) {
        if (this.urlKey in urlParameters) {
            this.setInDom(this.fromString(urlParameters[this.urlKey]));
        }
        else {
            this.setInDom(this.defaultValue);
        }
    }
    reset() {
        this.setInDom(this.defaultValue);
    }
    isDefault(urlParameters) {
        if (this.urlKey in urlParameters) {
            return JSON.stringify(this.fromString(urlParameters[this.urlKey])) == JSON.stringify(this.defaultValue);
        }
        else {
            return true;
        }
    }
}
class InputElementSearchParameter extends SearchParameter {
    constructor(defaultValue, urlKey, domElementID) {
        super(defaultValue, urlKey);
        this.domElement = document.getElementById(domElementID);
    }
    getFromDOM() {
        return this.fromString(this.domElement.value);
    }
    setInDom(value) {
        this.domElement.value = this.toString(value);
    }
}
class NumberSearchParameter extends InputElementSearchParameter {
    constructor(defaultValue, urlKey, domElementID) {
        super(defaultValue, urlKey, domElementID);
    }
    toString(value) {
        return value.toString();
    }
    fromString(value) {
        return Number.parseFloat(value);
    }
}
class StringSearchParameter extends InputElementSearchParameter {
    constructor(defaultValue, urlKey, domElementID) {
        super(defaultValue, urlKey, domElementID);
    }
    toString(value) {
        return value;
    }
    fromString(value) {
        return value;
    }
}
class BooleanSearchParameter extends SearchParameter {
    constructor(defaultValue, urlKey, domElementID) {
        super(defaultValue, urlKey);
        this.domElement = document.getElementById(domElementID);
    }
    getFromDOM() {
        return this.domElement.checked;
    }
    setInDom(value) {
        this.domElement.checked = value;
    }
    toString(value) {
        return value ? "true" : "false";
    }
    fromString(value) {
        return value == "true";
    }
}
class GearListSearchParameter extends InputElementSearchParameter {
    constructor(defaultValue, urlKey, domElementID) {
        super(defaultValue, urlKey, domElementID);
    }
    toString(value) {
        return value.join(", ");
    }
    fromString(value) {
        let items = value.split(",");
        const result = [];
        for (let item of items) {
            const gear = Number.parseInt(item.trim());
            if (!Number.isNaN(gear)) {
                result.push(gear);
            }
        }
        return result;
    }
}
class CheckboxedSearchParameter extends SearchParameter {
    constructor(targetSearchParameter, checkedByDefault, checkboxID) {
        super({ value: targetSearchParameter.defaultValue, checked: checkedByDefault }, targetSearchParameter.urlKey);
        this.targetSearchParameter = targetSearchParameter;
        this.checkbox = document.getElementById(checkboxID);
    }
    getFromDOM() {
        return {
            value: this.targetSearchParameter.getFromDOM(),
            checked: this.checkbox.checked
        };
    }
    setInDom(value) {
        this.targetSearchParameter.setInDom(value.value);
        this.checkbox.checked = value.checked;
    }
    toString(value) {
        throw new Error("Method not implemented.");
    }
    fromString(value) {
        throw new Error("Method not implemented.");
    }
    getUrlKeyValuePairFromDOM() {
        const value = this.getFromDOM();
        if (!value.checked) {
            return null;
        }
        else if (JSON.stringify(value.value) == JSON.stringify(this.targetSearchParameter.defaultValue)) {
            return this.urlKey + '=default';
        }
        else {
            return this.targetSearchParameter.getUrlKeyValuePairFromDOM();
        }
    }
    setFromUrl(urlParameters) {
        if (this.urlKey in urlParameters && urlParameters[this.urlKey] != 'default') {
            this.targetSearchParameter.setFromUrl(urlParameters);
        }
        else {
            this.targetSearchParameter.setInDom(this.targetSearchParameter.defaultValue);
        }
        this.checkbox.checked = this.urlKey in urlParameters;
    }
    isDefault(urlParameters) {
        if (this.urlKey in urlParameters && urlParameters[this.urlKey] != 'default') {
            return this.targetSearchParameter.isDefault(urlParameters);
        }
        else {
            return true;
        }
    }
}
class DistanceParameter extends SearchParameter {
    constructor(defaultValue, urlKey) {
        super(defaultValue, urlKey);
        this.halfRadioButton = document.getElementById("half");
        this.fullRadioButton = document.getElementById("full");
        this.anyRadioButton = document.getElementById("any");
    }
    getFromDOM() {
        if (this.halfRadioButton.checked) {
            return 0.5;
        }
        else if (this.fullRadioButton.checked) {
            return 1.0;
        }
        else if (this.anyRadioButton.checked) {
            return null;
        }
        throw new Error("No radio button is selected.");
    }
    setInDom(value) {
        switch (value) {
            case null:
                this.anyRadioButton.checked = true;
                break;
            case 0.5:
                this.halfRadioButton.checked = true;
                break;
            case 1.0:
                this.fullRadioButton.checked = true;
                break;
            default:
                throw new Error("Invalid value for gear distance.");
        }
    }
    toString(value) {
        switch (value) {
            case null:
                return "any";
            case 0.5:
                return "half";
            case 1.0:
                return "full";
            default:
                throw new Error("Invalid value for gear distance.");
        }
    }
    fromString(value) {
        const map = { "any": null, "half": 0.5, "full": 1.0 };
        return map[value];
    }
}
///<reference path="../SolutionList.ts" />
///<reference path="./SearchParameters.ts" />
class SearchParameters {
    constructor() {
        this.targetRatio = new StringSearchParameter("3/4", "targetratio", "ratio");
        this.error = new CheckboxedSearchParameter(new NumberSearchParameter(0.01, "error", "error"), false, "approximate");
        this.gearDistance = new DistanceParameter(0.5, "dst");
        this.include2DConnections = new BooleanSearchParameter(true, "incl2d", "include2dconnectionscheckbox");
        this.standardGears = new CheckboxedSearchParameter(new GearListSearchParameter(STANDARD_GEARS, "gears", "standardgearslist"), true, "standardgearscheckbox");
        this.customGears = new CheckboxedSearchParameter(new GearListSearchParameter(DEFAULT_CUSTOM_GEARS, "customgears", "customgearslist"), false, "customgearscheckbox");
        this.startGears = new GearListSearchParameter([], "start", "fixedStart");
        this.endGears = new GearListSearchParameter([], "end", "fixedEnd");
        this.excludePairsWithFixedGears = new BooleanSearchParameter(false, "epwfg", "exlude-pairs-with-fixed-gears");
        this.limitCount = new NumberSearchParameter(30, "count", "limitCount");
        this.limitTime = new NumberSearchParameter(30, "time", "limitTime");
        this.items = [
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
        this.advancedParameters = [
            this.customGears,
            this.startGears,
            this.endGears,
            this.excludePairsWithFixedGears,
            this.limitCount,
            this.limitTime
        ];
    }
    applyUrlParametersToForm(parameters) {
        for (let item of this.items) {
            item.setFromUrl(parameters);
        }
    }
    getUrlParametersFromForm() {
        const parts = [];
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
    advancedParametersUsed(parameters) {
        for (let item of this.advancedParameters) {
            if (!item.isDefault(parameters)) {
                return true;
            }
        }
        return false;
    }
    applyDefaults() {
        for (let item of this.items) {
            item.setInDom(item.defaultValue);
        }
    }
}
class SearchTab {
    constructor() {
        this.currentWorker = null;
        this.currentTask = null;
        this.currentTaskId = 0;
        this.animationSettings = { enabled: false, duration: 0 };
        this.searchParameters = new SearchParameters();
        this.resultDiv = document.getElementById("result");
        this.searchingSpan = document.getElementById("searching");
        this.animateCheckbox = document.getElementById('animate');
        this.rpmTextbox = document.getElementById('animate-rpm');
        this.updateAnimation();
        this.prepareEventListeners();
        this.searchParameters.applyDefaults();
    }
    getAvailableGears() {
        let result = [];
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
    onReceiveWorkerMessage(event) {
        if (event.data.id == this.currentTaskId) {
            if (event.data.usesDifferential) {
                this.currentTask.solutionList.add(new DifferentialSolution(event.data.sequence, this.currentTask));
            }
            else {
                this.currentTask.solutionList.add(new SequenceSolution(event.data.sequence, this.currentTask));
            }
            if (this.currentTask.solutionList.totalSolutions >= this.currentTask.maxNumberOfResults) {
                this.stopSearch();
            }
            this.updateAnimation();
        }
    }
    readFixedSequenceGears(currentTask) {
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
            }
            else {
                currentTask.fixedSecondary.push(currentTask.startSequence[i]);
                currentTask.fixedSecondaryFactor *= currentTask.startSequence[i];
            }
        }
        for (let i = 0; i < currentTask.endSequence.length; i++) {
            if ((currentTask.endSequence.length - 1 - i) % 2 == 1) {
                currentTask.fixedPrimary.push(currentTask.endSequence[i]);
                currentTask.fixedPrimaryFactor *= currentTask.endSequence[i];
            }
            else {
                currentTask.fixedSecondary.push(currentTask.endSequence[i]);
                currentTask.fixedSecondaryFactor *= currentTask.endSequence[i];
            }
        }
        currentTask.searchRatio = currentTask.targetRatio.multiply(new Fraction(currentTask.fixedSecondaryFactor, currentTask.fixedPrimaryFactor));
    }
    get2DFitCost(gear1, gear2) {
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
            }
            else if (x % 1 == 0 || y % 1 == 0) {
                lowestCost = Math.min(lowestCost, ASSIGNMENT_COST_HALF_FULL_2D);
            }
            else {
                lowestCost = Math.min(lowestCost, ASSIGNMENT_COST_HALF_2D);
            }
        }
        return lowestCost;
    }
    getGearAssignmentCosts(task, include2DConnections) {
        const result = {};
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
                }
                else {
                    const distance = getGearDistance(driverGear, followerGear);
                    if (distance % 1 == 0) {
                        cost += ASSIGNMENT_COST_FULL_1D;
                        violatesConstraint = false;
                    }
                    else if (distance % 0.5 == 0) {
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
                    }
                    else if (include2DConnections && assignmentCost2D < 0 && task.distanceConstraint == 0.5) {
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
    handleTaskTimeout() {
        const taskId = this.currentTaskId;
        setTimeout(function () {
            if (this.currentTask.id == taskId && this.currentWorker != null) {
                this.stopSearch();
            }
        }.bind(this), parseInt(document.getElementById('limitTime').value) * 1000);
    }
    startSearch() {
        const approximateSettings = this.searchParameters.error.getFromDOM();
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
        document.getElementById('resultcount').innerText = "0";
        document.getElementById('result-meta').style.display = 'block';
        document.getElementById('smallest-error-container').style.display = this.currentTask.exact ? 'none' : 'inline';
        document.getElementById('smallest-error').innerText = '';
        if (this.currentWorker != null) {
            this.currentWorker.terminate();
        }
        this.currentWorker = new Worker("app.js");
        this.currentWorker.onmessage = this.onReceiveWorkerMessage.bind(this);
        this.currentWorker.postMessage(this.currentTask);
        this.searchingSpan.style.display = "inline";
        this.currentTask.solutionList = new SolutionList(this.resultDiv, this.currentTask);
        this.handleTaskTimeout();
    }
    stopSearch() {
        if (this.currentWorker != null) {
            this.currentWorker.terminate();
            this.currentWorker = null;
        }
        this.searchingSpan.style.display = "none";
    }
    prepareEventListeners() {
        document.getElementById('calculate').addEventListener('click', function (event) {
            event.preventDefault();
            this.startSearch();
            window.history.pushState({}, "", this.getUrlParameters());
        }.bind(this));
        document.getElementById('stop').addEventListener('click', function (event) {
            event.preventDefault();
            this.stopSearch();
        }.bind(this));
        this.animateCheckbox.addEventListener('change', this.updateAnimation.bind(this));
        this.rpmTextbox.addEventListener('change', this.updateAnimation.bind(this));
    }
    getUrlParameters() {
        return this.searchParameters.getUrlParametersFromForm();
    }
    loadUrlParameters(parameters) {
        this.searchParameters.applyUrlParametersToForm(parameters);
        if (this.searchParameters.advancedParametersUsed(parameters)) {
            document.getElementById("advanced-options").open = true;
        }
        this.startSearch();
    }
    updateAnimation() {
        if (this.currentTask != null) {
            const animationRotationsPerSecond = this.animateCheckbox.checked ? parseFloat(this.rpmTextbox.value) / 60 : 0;
            this.currentTask.solutionList.updateAnimation(animationRotationsPerSecond);
        }
    }
}
const PIXELS_PER_MM = 2.5;
const STANDARD_GEARS = [1, 8, 16, 24, 40, 56, 12, 20, 28, 36, 60, 140];
const DEFAULT_CUSTOM_GEARS = [10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23, 25, 26, 27, 29, 30, 31, 32];
const HELPER_GEARS = [8, 16, 24, 40, 12, 20, 28, 36];
const DEFAULT_GEARS_STANDARD = '1,8,16,24,40,56,12,20,28,36,60,140';
const DEFAULT_GEARS_CUSTOM = '10,11,13,14,15,17,18,19,21,22,23,25,26,27,29,30,31,32';
const DEFAULT_FIT_ERROR = 0.4; // mm
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ASSIGNMENT_COST_FORBIDDEN = 1000;
const ASSIGNMENT_COST_FULL_1D = -13;
const ASSIGNMENT_COST_HALF_1D = -9;
const ASSIGNMENT_COST_FULL_2D = -12;
const ASSIGNMENT_COST_HALF_2D = -7;
const ASSIGNMENT_COST_HALF_FULL_2D = -8;
const ASSIGNMENT_COST_PERPENDICULAR = -2;
class SVGGenerator {
    constructor() {
        this.pathStrings = [];
    }
    addPolygon(vertices) {
        this.pathStrings.push("M " + vertices[0][0] + " " + vertices[0][1]);
        for (let i = 1; i < vertices.length; i++) {
            const vertex = vertices[i];
            this.pathStrings.push("L " + vertex[0] + " " + vertex[1]);
        }
        this.pathStrings.push("Z");
    }
    addCircle(x, y, diameter = 5) {
        const r = diameter / 2;
        this.pathStrings.push("M " + (x - r) + ", " + y);
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + diameter + ",0");
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + (-diameter) + ",0");
    }
    createSVG() {
        const svg = document.createElementNS(SVG_NAMESPACE, "svg");
        const path = document.createElementNS(SVG_NAMESPACE, "path");
        path.setAttribute("d", this.pathStrings.join(' '));
        svg.appendChild(path);
        return svg;
    }
}
class GearSVGGenerator extends SVGGenerator {
    constructor(n) {
        super();
        this.teeth = n;
        this.radiusInner = n / 2 - 1.2;
        this.radiusOuter = n / 2 + 0.85;
        if (n == 140) {
            this.radiusOuter += 14;
        }
        else {
            this.createTeeth(n);
        }
        this.createDecoration();
    }
    static createGearSVG(n) {
        if (!(n in this.gearCache)) {
            this.gearCache[n] = new GearSVGGenerator(n);
        }
        return this.gearCache[n].createSVG();
    }
    createDecoration() {
        let xExtension = 0;
        let yExtension = 0;
        let extensionSize = 0.5;
        let hasAxleHole = true;
        switch (this.teeth) {
            case 20:
                xExtension = 1.6;
                yExtension = 1.6;
                this.createCutout(9.3 / 2, this.radiusInner - 2);
                break;
            case 28:
                yExtension = 1.2;
                this.addCircle(-8, 0);
                this.addCircle(+8, 0);
                this.addCircle(0, 8);
                this.addCircle(0, -8);
                this.createCutout(6, this.radiusInner - 2, 4);
                break;
            case 36:
                yExtension = 1.2;
                this.addCircle(-8, 0);
                this.addCircle(+8, 0);
                this.createAxleHole(0, 8, 0, 1.2);
                this.createAxleHole(0, -8, 0, 1.2);
                this.createCutout(12.5, this.radiusInner - 2);
                break;
            case 60:
                hasAxleHole = false;
                this.addCircle(0, 0, 25.4);
                break;
            case 16:
                this.addCircle(0, -4, 3.4);
                this.addCircle(0, +4, 3.4);
                this.addCircle(-4, 0, 3.4);
                this.addCircle(+4, 0, 3.4);
                break;
            case 24:
                yExtension = 3.8;
                extensionSize = 1.6;
                this.addCircle(-4, -4);
                this.addCircle(-4, +4);
                this.addCircle(+4, +4);
                this.addCircle(+4, -4);
                break;
            case 40:
                yExtension = 2;
                for (let x = -1; x < 2; x += 2) {
                    for (let y = -1; y < 2; y += 2) {
                        this.addCircle(x * 4, y * 4);
                        this.addCircle(x * 12, y * 4);
                        this.addCircle(x * 4, y * 12);
                    }
                }
                this.createAxleHole(0, -8, 4.4, 0);
                this.createAxleHole(0, +8, 4.4, 0);
                this.createAxleHole(+8, 0, 0, 4.4);
                this.createAxleHole(-8, 0, 0, 4.4);
                break;
            case 56:
                hasAxleHole = false;
                this.createTeeth(24, true);
                break;
            case 140:
                hasAxleHole = false;
                this.pathStrings.push("M " + -this.radiusOuter + ", 0");
                this.pathStrings.push("a " + this.radiusOuter + "," + this.radiusOuter + " 1 0, 1 " + (this.radiusOuter * 2) + ",0");
                this.pathStrings.push("a " + this.radiusOuter + "," + this.radiusOuter + " 1 0, 1 " + (-this.radiusOuter * 2) + ",0");
                this.createAxleHole(-8 * 10, 0, 0);
                this.createAxleHole(+8 * 10, 0, 0);
                this.createAxleHole(0, +8 * 10, 0);
                this.createAxleHole(0, -8 * 10, 0);
                this.createTeeth(this.teeth, true, true);
                break;
            default:
                if (this.teeth >= 18) {
                    this.createCutout(4.4, this.radiusInner - 2);
                }
        }
        if (hasAxleHole) {
            this.createAxleHole(0, 0, xExtension, yExtension, extensionSize);
        }
    }
    createTeeth(n, cut = false, invert = false) {
        const vertices = [];
        const radiusPitch = n / 2;
        const radiusInner = radiusPitch - 1.2 * (invert ? -1 : 1);
        const radiusOuter = radiusPitch + 0.85 * (invert ? -1 : 1);
        const radiusIntermediate = radiusInner + 0.9 * (invert ? -1 : 1);
        for (let i = 0; i < n; i++) {
            const fraction = 2 * Math.PI / n;
            const angle = i * fraction;
            vertices.push(getOnCircle(angle - fraction * 0.29, radiusInner));
            vertices.push(getOnCircle(angle - fraction * 0.25, radiusIntermediate));
            vertices.push(getOnCircle(angle - fraction * 0.11, radiusOuter));
            vertices.push(getOnCircle(angle + fraction * 0.11, radiusOuter));
            vertices.push(getOnCircle(angle + fraction * 0.25, radiusIntermediate));
            vertices.push(getOnCircle(angle + fraction * 0.29, radiusInner));
        }
        if (cut) {
            vertices.reverse();
        }
        this.addPolygon(vertices);
    }
    createCutout(radiusInner, radiusOuter, margin = 0.8) {
        let inner = Math.sqrt(Math.pow(radiusInner, 2.0) - Math.pow(margin, 2.0));
        const outer = Math.sqrt(Math.pow(radiusOuter, 2.0) - Math.pow(margin, 2.0));
        this.pathStrings.push("M " + margin + ", " + outer);
        this.pathStrings.push("A " + radiusOuter + " " + radiusOuter + " 0 0 0 " + outer + ", " + margin);
        this.pathStrings.push("L " + inner + ", " + margin);
        this.pathStrings.push("A " + radiusInner + " " + radiusInner + " 0 0 1 " + +margin + ", " + inner);
        this.pathStrings.push("Z");
        this.pathStrings.push("M " + -margin + ", " + -outer);
        this.pathStrings.push("A " + radiusOuter + " " + radiusOuter + " 0 0 0 " + -outer + ", " + -margin);
        this.pathStrings.push("L " + -inner + ", " + -margin);
        this.pathStrings.push("A " + radiusInner + " " + radiusInner + " 0 0 1 " + +-margin + ", " + -inner);
        this.pathStrings.push("Z");
        this.pathStrings.push("M" + margin + ", " + -inner);
        this.pathStrings.push("A " + radiusInner + " " + radiusInner + " 0 0 1 " + inner + ", " + -margin);
        this.pathStrings.push("L" + outer + ", " + -margin);
        this.pathStrings.push("A " + radiusOuter + " " + radiusOuter + " 0 0 0 " + margin + ", " + -outer);
        this.pathStrings.push("Z");
        this.pathStrings.push("M" + -margin + ", " + inner);
        this.pathStrings.push("A " + radiusInner + " " + radiusInner + " 0 0 1 " + -inner + ", " + margin);
        this.pathStrings.push("L" + -outer + ", " + margin);
        this.pathStrings.push("A " + radiusOuter + " " + radiusOuter + " 0 0 0 " + -margin + ", " + outer);
        this.pathStrings.push("Z");
    }
    createAxleHole(x = 0, y = 0, xExtension = 2, yExtension = 0, extensionSize = 0.5) {
        const a = 1.78 / 2;
        const b = 4.78 / 2;
        const c = extensionSize / 2;
        const vertices = [
            [x - b, y - a],
            [x - b, y - c],
            [x - b - xExtension, y - c],
            [x - b - xExtension, y + c],
            [x - b, y + c],
            [x - b, y + a],
            [x - a, y + a],
            [x - a, y + b],
            [x - c, y + b],
            [x - c, y + b + yExtension],
            [x + c, y + b + yExtension],
            [x + c, y + b],
            [x + a, y + b],
            [x + a, y + a],
            [x + b, y + a],
            [x + b, y + c],
            [x + b + xExtension, y + c],
            [x + b + xExtension, y - c],
            [x + b, y - c],
            [x + b, y - a],
            [x + a, y - a],
            [x + a, y - b],
            [x + c, y - b],
            [x + c, y - b - yExtension],
            [x - c, y - b - yExtension],
            [x - c, y - b],
            [x - a, y - b],
            [x - a, y - a],
        ];
        this.addPolygon(vertices);
    }
    createSVG() {
        const svg = super.createSVG();
        svg.setAttribute("height", (this.radiusOuter * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("width", (this.radiusOuter * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("viewBox", (-this.radiusOuter) + " " + (-this.radiusOuter) + " " + (2 * this.radiusOuter) + " " + (2 * this.radiusOuter));
        svg.classList.add("gear");
        if (!STANDARD_GEARS.includes(this.teeth)) {
            svg.classList.add("custom");
        }
        return svg;
    }
    static createWormGearSVG(newStyle = false) {
        const rxOuter = newStyle ? 7.4 : 4.9;
        const rxInner = 3;
        const ry = newStyle ? 4 : 8;
        const stepCount = newStyle ? 4.8 : 7;
        const yStep = 3.2;
        const vertices = [];
        const teethOffset = newStyle ? -0.34 : -0.125;
        for (let i = 0; i < stepCount; i++) {
            vertices.push([-rxOuter, -ry + i * yStep + yStep * (0.0 + teethOffset)]);
            vertices.push([-rxOuter, -ry + i * yStep + yStep * (0.25 + teethOffset)]);
            vertices.push([-rxInner, -ry + i * yStep + yStep * (0.5 + teethOffset)]);
            vertices.push([-rxInner, -ry + i * yStep + yStep * (0.75 + teethOffset)]);
        }
        if (newStyle) {
            vertices.pop();
        }
        vertices.push([-rxOuter, -ry + stepCount * yStep]);
        vertices.push([rxInner, -ry + stepCount * yStep]);
        for (let i = 0; i < stepCount; i++) {
            vertices.push([rxInner, -ry + (stepCount - i) * yStep - yStep * 0.125]);
            vertices.push([+rxOuter, -ry + (stepCount - i) * yStep - yStep * 0.375]);
            vertices.push([rxOuter, -ry + (stepCount - i) * yStep - yStep * 0.625]);
            vertices.push([+rxInner, -ry + (stepCount - i) * yStep - yStep * 0.875]);
        }
        vertices.push([rxInner, -ry]);
        if (newStyle) {
            vertices.pop();
        }
        vertices.push([+rxInner, -ry]);
        const stringVertices = [];
        for (const vertex of vertices) {
            stringVertices.push(vertex[0] + "," + vertex[1]);
        }
        const svg = document.createElementNS(SVG_NAMESPACE, "svg");
        const polygon = document.createElementNS(SVG_NAMESPACE, "polygon");
        polygon.setAttribute("points", stringVertices.join(' '));
        svg.appendChild(polygon);
        svg.setAttribute("height", (ry * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("width", (rxOuter * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("viewBox", (-rxOuter) + " " + (-ry) + " " + (2 * rxOuter) + " " + (2 * ry));
        svg.classList.add("worm");
        return svg;
    }
}
GearSVGGenerator.gearCache = {};
class DifferentialCasingSVGGenerator extends SVGGenerator {
    constructor() {
        super();
        const vertices = [
            [8, 0],
            [8, -1.5],
            [14, -1.5],
            [14, -6.5],
            [11, -6.5],
            [11, -25.5],
            [10, -25.5],
            [10, -30.5],
            [8, -30.5],
            [8, -32]
        ];
        for (var i = vertices.length - 1; i >= 0; i--) {
            vertices.push([-vertices[i][0], vertices[i][1]]);
        }
        this.addPolygon(vertices);
        this.addPolygon([
            [-8.5, -8],
            [-8.5, -24],
            [8.5, -24],
            [8.5, -14.8],
            [3, -14.8],
            [3, -17.2],
            [8.5, -17.2],
            [8.5, -8],
        ]);
    }
    createSVG() {
        const svg = super.createSVG();
        svg.setAttribute("height", (32 * PIXELS_PER_MM).toString());
        svg.setAttribute("width", (28 * PIXELS_PER_MM).toString());
        svg.setAttribute("viewBox", "-14 -32 28 32");
        svg.classList.add("differential");
        return svg;
    }
    static createDifferentialCasing() {
        if (DifferentialCasingSVGGenerator.instance == null) {
            DifferentialCasingSVGGenerator.instance = new DifferentialCasingSVGGenerator();
        }
        return DifferentialCasingSVGGenerator.instance.createSVG();
    }
}
DifferentialCasingSVGGenerator.instance = null;
///<reference path="../../config.ts" />
///<reference path="../gears/GearSVGGenerator.ts" />
function getConnectionScore(x, y) {
    if (x % 1 == 0 && y % 1 == 0) {
        return 3;
    }
    else if (x % 1 == 0 || y % 1 == 0) {
        return 1;
    }
    else {
        return 0;
    }
}
class FitGears {
    constructor() {
        this.gear1 = null;
        this.gear2 = null;
        this.suppressUpdate = false;
        this.resultElements = [];
        this.gear1Button = document.getElementById("gear-button1");
        this.gear2Button = document.getElementById("gear-button2");
        this.resultsContainer = document.getElementById('fit-results-container');
        this.gear1Button.addEventListener("click", function (event) {
            gearPicker.show(this.updateGear1.bind(this), this.gear1Button);
        }.bind(this));
        this.gear2Button.addEventListener("click", function (event) {
            gearPicker.show(this.updateGear2.bind(this), this.gear2Button);
        }.bind(this));
        this.includeHalfUnitsCheckbox = document.getElementById('fit-half');
        this.includeHalfUnitsCheckbox.addEventListener("change", this.update.bind(this));
        this.maximumErrorTextbox = document.getElementById('fit-error');
        this.maximumErrorTextbox.value = DEFAULT_FIT_ERROR.toString();
        this.maximumErrorTextbox.addEventListener("change", this.update.bind(this));
        this.suppressUpdate = true;
        this.updateGear1(40);
        this.updateGear2(28);
        document.getElementById("form-fit-gears").addEventListener("submit", function (event) { event.preventDefault(); });
        this.suppressUpdate = false;
        this.update();
    }
    updateGear1(gear) {
        this.gear1 = gear;
        this.gear1Button.innerText = '';
        this.gear1Button.appendChild(GearSVGGenerator.createGearSVG(gear));
        const description = document.createElement("div");
        description.innerText = gear.toString();
        description.classList.add("fit-gear-teeth");
        this.gear1Button.appendChild(description);
        this.update();
    }
    updateGear2(gear) {
        this.gear2 = gear;
        this.gear2Button.innerText = '';
        this.gear2Button.appendChild(GearSVGGenerator.createGearSVG(gear));
        const description = document.createElement("div");
        description.innerText = gear.toString();
        description.classList.add("fit-gear-teeth");
        this.gear2Button.appendChild(description);
        this.update();
    }
    showConnection(gear1, gear2, includeHalfUnits) {
        this.suppressUpdate = true;
        this.updateGear1(gear1);
        this.updateGear2(gear2);
        this.includeHalfUnitsCheckbox.checked = includeHalfUnits;
        this.maximumErrorTextbox.value = DEFAULT_FIT_ERROR.toString();
        document.getElementById("tab-fit").checked = true;
        this.suppressUpdate = false;
        this.update();
    }
    update() {
        if (this.suppressUpdate || this.gear1 == null || this.gear2 == null) {
            return;
        }
        const maxError = Number.parseFloat(this.maximumErrorTextbox.value) / 8;
        let radius1 = this.gear1 / 16;
        let radius2 = this.gear2 / 16;
        if (this.gear1 == 140) {
            radius1 -= radius2 * 2;
        }
        else if (this.gear2 == 140) {
            radius2 -= radius1 * 2;
        }
        const targetDistance = radius1 + radius2;
        this.resultsContainer.innerText = '';
        if (this.gear1 == 1 || this.gear2 == 1) {
            return;
        }
        const step = this.includeHalfUnitsCheckbox.checked ? 0.5 : 1.0;
        let foundAnything = false;
        this.resultElements = [];
        if (gearsFitPerpendicularly(this.gear1, this.gear2)) {
            const resultElement = document.createElement('div');
            resultElement.classList.add('sequence');
            resultElement.innerText = "These gears can be connected using perpendicular axles.";
            this.resultsContainer.appendChild(resultElement);
            foundAnything = true;
        }
        for (let y = 0; y <= Math.ceil(targetDistance); y += step) {
            const x = Math.round((Math.sqrt(Math.pow(targetDistance, 2) - Math.pow(y, 2))) / step) * step;
            if (Number.isNaN(x) || x < y) {
                continue;
            }
            const totalDistance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            const error = totalDistance - targetDistance;
            if (Math.abs(error) > maxError) {
                continue;
            }
            foundAnything = true;
            this.addResult(x, y, totalDistance, targetDistance);
        }
        let foundSoultionWithHelperGear = false;
        this.resultElements = [];
        if (this.gear1 != 140 && this.gear2 != 140) {
            for (const helperGear of HELPER_GEARS) {
                const helperRadius = helperGear / 16;
                const targetHelperDistance = radius1 + helperRadius;
                for (let helperY = 0; helperY <= Math.ceil(targetHelperDistance); helperY += step) {
                    const helperX = Math.round((Math.sqrt(Math.pow(targetHelperDistance, 2) - Math.pow(helperY, 2))) / step) * step;
                    if (Number.isNaN(helperX) || helperX < helperY) {
                        continue;
                    }
                    const helperDistance = Math.sqrt(Math.pow(helperX, 2) + Math.pow(helperY, 2));
                    if (Math.abs(helperDistance - targetHelperDistance) > maxError) {
                        continue;
                    }
                    if (this.gear1 == helperGear && helperY % 1 == 0 && helperX % 1 == 0) {
                        continue;
                    }
                    const targetDistance = helperRadius + radius2;
                    for (let y = 0; y <= Math.ceil(targetDistance); y += step) {
                        const x = Math.round((Math.sqrt(Math.pow(targetDistance, 2) - Math.pow(y, 2))) / step) * step;
                        if (Number.isNaN(x) || x < y) {
                            continue;
                        }
                        const totalDistance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                        const error = totalDistance - targetDistance;
                        if (Math.abs(error) > maxError) {
                            continue;
                        }
                        if (this.gear2 == helperGear && y % 1 == 0 && x % 1 == 0) {
                            continue;
                        }
                        if (!foundSoultionWithHelperGear) {
                            const headline = document.createElement('h2');
                            headline.innerText = 'Solutions with helper gear';
                            this.resultsContainer.appendChild(headline);
                        }
                        foundAnything = true;
                        foundSoultionWithHelperGear = true;
                        this.addResult(x + helperX, y + helperY, totalDistance, targetDistance, {
                            gear: helperGear, x: helperX, y: helperY, distance: helperDistance, targetDistance: targetHelperDistance
                        });
                    }
                }
            }
        }
        if (!foundAnything) {
            this.resultsContainer.innerText = "Nothing found.";
        }
    }
    addResult(x, y, totalDistance, targetDistance, helperGearData = null) {
        if (this.gear1 == null || this.gear2 == null) {
            return;
        }
        const resultElement = document.createElement('div');
        resultElement.classList.add('sequence');
        const fitBox = document.createElement('div');
        fitBox.classList.add('fit-box');
        const margin = 1.5 * 8 * PIXELS_PER_MM;
        const gearSVG1 = GearSVGGenerator.createGearSVG(this.gear1);
        const svgSize1 = gearSVG1.width.baseVal.value;
        gearSVG1.style.left = (margin - svgSize1 / 2) + "px";
        gearSVG1.style.top = (margin - svgSize1 / 2) + "px";
        fitBox.appendChild(gearSVG1);
        const gearSVG2 = GearSVGGenerator.createGearSVG(this.gear2);
        const svgSize2 = gearSVG2.width.baseVal.value;
        gearSVG2.style.left = (margin + x * 8 * PIXELS_PER_MM - svgSize2 / 2) + "px";
        gearSVG2.style.top = (margin + y * 8 * PIXELS_PER_MM - svgSize2 / 2) + "px";
        fitBox.appendChild(gearSVG2);
        if (helperGearData !== null) {
            const helperGearSVG = GearSVGGenerator.createGearSVG(helperGearData.gear);
            const helperGearSVGSize = helperGearSVG.width.baseVal.value;
            helperGearSVG.style.left = (margin + helperGearData.x * 8 * PIXELS_PER_MM - helperGearSVGSize / 2) + "px";
            helperGearSVG.style.top = (margin + helperGearData.y * 8 * PIXELS_PER_MM - helperGearSVGSize / 2) + "px";
            fitBox.appendChild(helperGearSVG);
            const helperGearCorrection = this.getGearRotationCorrection(this.gear1, helperGearData.gear, helperGearData.x, helperGearData.y);
            helperGearSVG.style.transform = 'rotate(' + helperGearCorrection + 'deg)';
            gearSVG2.style.transform = 'rotate(' + this.getGearRotationCorrection(helperGearData.gear, this.gear2, x - helperGearData.x, y - helperGearData.y, helperGearCorrection) + 'deg)';
        }
        else {
            gearSVG2.style.transform = 'rotate(' + this.getGearRotationCorrection(this.gear1, this.gear2, x, y) + 'deg)';
        }
        for (let a = 0; a <= Math.ceil(x); a++) {
            for (let b = 0; b <= Math.ceil(y); b++) {
                const holeElement = document.createElement('div');
                holeElement.classList.add('hole');
                holeElement.style.left = (margin - 2 + a * 8 * PIXELS_PER_MM) + "px";
                holeElement.style.top = (margin - 2 + b * 8 * PIXELS_PER_MM) + "px";
                fitBox.appendChild(holeElement);
            }
        }
        const radius1 = this.gear1 / 16;
        const radius2 = this.gear2 / 16;
        fitBox.style.width = (x * 8 * PIXELS_PER_MM + margin + Math.max(margin, radius2 * 8 * PIXELS_PER_MM + 20)) + "px";
        fitBox.style.height = (y * 8 * PIXELS_PER_MM + margin + Math.max(margin, radius2 * 8 * PIXELS_PER_MM + 20)) + "px";
        resultElement.appendChild(fitBox);
        if (helperGearData === null) {
            resultElement.appendChild(this.createResultText(x, y, this.gear1 == 140 || this.gear2 == 140, totalDistance, targetDistance));
        }
        else {
            resultElement.appendChild(this.createResultText(helperGearData.x, helperGearData.y, this.gear1 == 140, helperGearData.distance, helperGearData.targetDistance));
            resultElement.appendChild(this.createResultText(x - helperGearData.x, y - helperGearData.y, this.gear2 == 140, totalDistance, targetDistance));
            const resultText = document.createElement('div');
            const distancesSpan = document.createElement("span");
            distancesSpan.innerText = x + " ✕ " + y;
            if (x % 1 == 0 && y % 1 == 0) {
                distancesSpan.classList.add("result-good");
            }
            else {
                distancesSpan.classList.add("result-ok");
            }
            resultText.appendChild(distancesSpan);
            const textSpan = document.createElement("span");
            textSpan.innerText = " total using a " + helperGearData.gear + " teeth helper gear";
            resultText.appendChild(textSpan);
            resultElement.appendChild(resultText);
        }
        let score = getConnectionScore(x, y);
        if (helperGearData != null) {
            score *= 4;
            score += getConnectionScore(helperGearData.x, helperGearData.y);
            score += getConnectionScore(x - helperGearData.x, y - helperGearData.y);
            score -= helperGearData.gear / 100; // Prefer smaller helper gears if all else is equal
        }
        for (let index = 0; index < this.resultElements.length; index++) {
            if (score > this.resultElements[index][1]) {
                this.resultsContainer.insertBefore(resultElement, this.resultElements[index][0]);
                this.resultElements.splice(index, 0, [resultElement, score]);
                return;
            }
        }
        this.resultElements.push([resultElement, score]);
        this.resultsContainer.appendChild(resultElement);
    }
    getGearRotationCorrection(gear1, gear2, x, y, gear1Rotation = 0) {
        const angle = Math.atan2(y, x);
        let gear1ToothPosition = (angle / (2 * Math.PI) * gear1 - gear1Rotation * gear1 / 360) % 1;
        const gear2ToothPosition = ((angle + Math.PI) / (2 * Math.PI) * gear2) % 1;
        if (gear1 == 140 || gear2 == 140) {
            gear1ToothPosition = 1.0 - gear1ToothPosition;
        }
        const correction = (gear1ToothPosition + gear2ToothPosition + 0.5) % 1; // in teeth
        return correction / gear2 * 360;
    }
    createResultText(x, y, hasBananaGear, totalDistance, targetDistance) {
        const resultText = document.createElement('div');
        let error = totalDistance - targetDistance;
        if (hasBananaGear) {
            error *= -1;
        }
        const distancesSpan = document.createElement("span");
        distancesSpan.innerText = x + " ✕ " + y;
        if (x % 1 == 0 && y % 1 == 0) {
            distancesSpan.classList.add("result-good");
        }
        else {
            distancesSpan.classList.add("result-ok");
        }
        resultText.appendChild(distancesSpan);
        const errorSpan = document.createElement("span");
        if (error == 0) {
            errorSpan.innerText = " (exact fit)";
            errorSpan.classList.add("result-good");
        }
        else {
            errorSpan.innerText = ", distance: " + (Math.round(totalDistance * 100) / 100) + " / " + targetDistance + ", error: " + (Math.round(Math.abs(error) * 1000) / 1000) + " units (" + (Math.round(Math.abs(error) * 8 * 100) / 100) + "mm) " + (error < 0 ? "too close" : "too far");
        }
        resultText.appendChild(errorSpan);
        return resultText;
    }
}
class Fraction {
    constructor(a, b = 1, reduce = true) {
        this.a = a;
        this.b = b;
        if (!isApproximatelyInteger(this.a) || !isApproximatelyInteger(this.b)) {
            while (!isApproximatelyInteger(this.a) || !isApproximatelyInteger(this.b)) {
                this.a *= 10;
                this.b *= 10;
            }
            this.a = Math.round(this.a);
            this.b = Math.round(this.b);
        }
        if (reduce) {
            const n = greatestCommonDenominator(this.a, this.b);
            this.a /= n;
            this.b /= n;
        }
    }
    getDecimal(digits = null) {
        if (digits === null) {
            return this.a / this.b;
        }
        else {
            return Math.round(this.a / this.b * Math.pow(10, digits)) / Math.pow(10, digits);
        }
    }
    extend(factor) {
        return new Fraction(this.a * factor, this.b * factor, false);
    }
    multiply(fraction) {
        return new Fraction(this.a * fraction.a, this.b * fraction.b);
    }
    divide(fraction) {
        return new Fraction(this.a * fraction.b, this.b * fraction.a);
    }
    divideByFactor(value) {
        return new Fraction(this.a, this.b * value);
    }
    multiplyByFactor(value) {
        return new Fraction(this.a * value, this.b);
    }
    add(fraction) {
        return new Fraction(this.a * fraction.b + fraction.a * this.b, this.b * fraction.b);
    }
    subtract(fraction) {
        return new Fraction(this.a * fraction.b - fraction.a * this.b, this.b * fraction.b);
    }
    inverse() {
        return new Fraction(this.b, this.a);
    }
    toString() {
        return this.a + " / " + this.b;
    }
    createDiv() {
        const result = document.createElement("div");
        result.classList.add("fraction");
        if (this.b == 1) {
            let integer = document.createElement("div");
            integer.classList.add("integer");
            integer.innerText = this.a.toString();
            result.appendChild(integer);
        }
        else {
            const container = document.createElement("div");
            container.classList.add("fraction-container");
            const nominator = document.createElement("div");
            nominator.classList.add("nominator");
            nominator.innerText = this.a.toString();
            container.appendChild(nominator);
            const denominator = document.createElement("div");
            denominator.classList.add("denominator");
            denominator.innerText = this.b.toString();
            container.appendChild(denominator);
            result.appendChild(container);
        }
        const decimal = document.createElement("div");
        decimal.classList.add("decimal");
        decimal.innerText = this.getDecimal(5).toString();
        result.appendChild(decimal);
        return result;
    }
    static parse(value) {
        if (value.includes('/')) {
            const parts = value.split('/');
            return new Fraction(Number.parseFloat(parts[0].trim()), Number.parseFloat(parts[1].trim()));
        }
        else {
            return new Fraction(Number.parseFloat(value.trim()));
        }
    }
}
function gearsFitPerpendicularly(gear1, gear2) {
    return (gear1 - 4) % 8 == 0 && (gear2 - 4) % 8 == 0 && gear1 != 140 && gear2 != 140;
}
function getGearDistance(gear1, gear2) {
    if (gear1 == 1 || gear2 == 1) {
        const useNewStyleWormGear = (gear1 + gear2 + 11) % 8 == 0;
        return (gear1 + gear2 - 1 + (useNewStyleWormGear ? 12 : 8)) / 16;
    }
    else if (gear1 == 140 || gear2 == 140) {
        return (Math.max(gear1, gear2) - Math.min(gear1, gear2)) / 16;
    }
    else {
        return (gear1 + gear2) / 16;
    }
}
class Connection {
    constructor(gear1, gear2) {
        this.svg1 = null;
        this.svg2 = null;
        this.rotationSpeed = 1;
        this.gear1 = gear1;
        this.gear2 = gear2;
        this.useNewStyleWormGear = (gear1 + gear2 + 11) % 8 == 0;
        this.distance = getGearDistance(gear1, gear2);
        this.fraction = new Fraction(gear1, gear2);
        this.factor = this.fraction.getDecimal();
    }
    createDiv() {
        const result = document.createElement("div");
        result.setAttribute("class", "connection");
        const table = document.createElement("table");
        let row = document.createElement("tr");
        let cell = document.createElement("td");
        if (this.gear1 == 1) {
            this.svg1 = GearSVGGenerator.createWormGearSVG(this.useNewStyleWormGear);
            cell.appendChild(this.svg1);
        }
        else {
            this.svg1 = GearSVGGenerator.createGearSVG(this.gear1);
            cell.appendChild(this.svg1);
        }
        row.appendChild(cell);
        cell = document.createElement("td");
        if (this.gear2 == 1) {
            this.svg2 = GearSVGGenerator.createWormGearSVG(this.useNewStyleWormGear);
            cell.appendChild(this.svg2);
        }
        else {
            this.svg2 = GearSVGGenerator.createGearSVG(this.gear2);
            if (this.gear2 % 2 == 0) {
                this.svg2.style.transform = 'rotate(' + (180 / this.gear2) + 'deg)';
            }
            cell.appendChild(this.svg2);
        }
        row.appendChild(cell);
        table.appendChild(row);
        row = document.createElement("tr");
        cell = document.createElement("td");
        cell.setAttribute("class", "teeth");
        cell.innerText = this.gear1.toString();
        row.appendChild(cell);
        cell = document.createElement("td");
        cell.innerText = this.gear2.toString();
        cell.setAttribute("class", "teeth");
        row.appendChild(cell);
        table.appendChild(row);
        result.appendChild(table);
        const distanceDiv = document.createElement("div");
        const distanceSpan = document.createElement("span");
        distanceDiv.classList.add("distance");
        distanceSpan.innerText = this.distance + (this.distance == 1 ? " unit" : " units");
        if (this.distance % 1 == 0) {
            distanceSpan.classList.add("result-good");
        }
        else if (this.distance % 0.5 == 0) {
            distanceSpan.classList.add("result-ok");
        }
        else {
            distanceSpan.classList.add("result-bad");
        }
        distanceSpan.title = "Distance between axes";
        distanceDiv.appendChild(distanceSpan);
        if (gearsFitPerpendicularly(this.gear1, this.gear2)) {
            const perpendicular = document.createElement("span");
            perpendicular.innerText = ' or perpendicular';
            perpendicular.title = 'The gears can be placed on perpendicular axles.';
            distanceDiv.appendChild(perpendicular);
        }
        if (this.gear1 != 1 && this.gear2 != 1) {
            let solutionCount = 0;
            let fullSolution = null;
            let halfSolution = null;
            let radius1 = this.gear1 / 16;
            let radius2 = this.gear2 / 16;
            if (this.gear1 == 140) {
                radius1 -= radius2 * 2;
            }
            else if (this.gear2 == 140) {
                radius2 -= radius1 * 2;
            }
            const targetDistance = radius1 + radius2;
            const maxError = DEFAULT_FIT_ERROR / 8;
            const step = 0.5;
            if (searchTab !== null && searchTab.currentTask !== null) {
                searchTab.currentTask.distanceConstraint == 1 ? 1 : 0.5;
            }
            for (let y = 0; y <= Math.ceil(targetDistance); y += step) {
                const x = Math.round((Math.sqrt(Math.pow(targetDistance, 2) - Math.pow(y, 2))) / step) * step;
                if (y == 0 || Number.isNaN(x) || x < y) {
                    continue;
                }
                const totalDistance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                const error = totalDistance - targetDistance;
                if (Math.abs(error) > maxError) {
                    continue;
                }
                solutionCount++;
                if (fullSolution == null && x % 1 == 0 && y % 1 == 0) {
                    fullSolution = [x, y];
                }
                if (fullSolution == null && halfSolution == null) {
                    halfSolution = [x, y];
                }
            }
            if (solutionCount > 0) {
                const orSpan = document.createElement("span");
                orSpan.innerText = " or ";
                orSpan.classList.add("result-bad");
                distanceDiv.appendChild(orSpan);
                const fitSpan = document.createElement("span");
                if (fullSolution != null) {
                    fitSpan.innerText = fullSolution[0] + " ✕ " + fullSolution[1];
                    solutionCount--;
                    fitSpan.classList.add("result-good");
                }
                else if (halfSolution != null && this.distance % 0.5 != 0) {
                    fitSpan.innerText = halfSolution[0] + " ✕ " + halfSolution[1];
                    solutionCount--;
                    fitSpan.classList.add("result-ok");
                }
                else if (solutionCount > 0) {
                    fitSpan.innerText += "2D";
                    fitSpan.classList.add("result-bad");
                }
                fitSpan.title = "These gears can also be connected by offsetting the axles along two dimensions.";
                distanceDiv.appendChild(fitSpan);
            }
        }
        result.appendChild(distanceDiv);
        if (this.gear1 != 1 && this.gear2 != 1) {
            distanceDiv.classList.add("clickable");
            distanceDiv.addEventListener("click", this.showFitGearsTab.bind(this));
        }
        return result;
    }
    updateAnimation(rotationsPerSecond) {
        const enabled = rotationsPerSecond != 0;
        const svg1 = this.svg1.firstChild;
        const svg2 = this.svg2.firstChild;
        svg1.style.animationPlayState = enabled ? 'running' : 'paused';
        svg2.style.animationPlayState = enabled ? 'running' : 'paused';
        if (enabled) {
            const duration = Math.abs(1.0 / rotationsPerSecond / this.rotationSpeed);
            svg1.style.animationDuration = duration + "s";
            svg1.style.animationDirection = (rotationsPerSecond * this.rotationSpeed < 0) ? 'reverse' : '';
            svg2.style.animationDuration = (duration / this.factor) + "s";
            svg2.style.animationDirection = (rotationsPerSecond * this.rotationSpeed > 0) ? 'reverse' : '';
        }
    }
    showFitGearsTab() {
        let includeHalfUnits = true;
        if (searchTab !== null && searchTab.currentTask !== null) {
            includeHalfUnits = searchTab.currentTask.distanceConstraint != 1;
        }
        fitGears.showConnection(this.gear1, this.gear2, includeHalfUnits);
    }
}
///<reference path="../../model/Fraction.ts" />
///<reference path="../Connection.ts" />
class SequenceEditor {
    constructor(element) {
        this.startFraction = new Fraction(1);
        this.resultFraction = new Fraction(1);
        this.danglingGear = null;
        this.connections = [];
        this.container = element;
        this.startFractionContainer = document.createElement('span');
        this.container.appendChild(this.startFractionContainer);
        this.connectionContainer = document.createElement('span');
        this.container.appendChild(this.connectionContainer);
        this.resultFractionContainer = document.createElement('span');
        this.container.appendChild(this.resultFractionContainer);
        this.addButtonContainer = document.createElement('span');
        this.addButtonContainer.classList.add('add-container');
        this.container.appendChild(this.addButtonContainer);
        this.addButton = document.createElement('button');
        this.addButton.classList.add('add-gear');
        this.addButton.innerText = '+';
        this.addButtonContainer.appendChild(this.addButton);
        this.permalink = document.getElementById('editor-permalink');
        this.animateCheckbox = document.getElementById('editor-animate');
        this.animateRpmInput = document.getElementById('editor-animate-rpm');
        this.clear();
        this.updateAnimation();
        const sequenceEditor = this;
        this.addButton.addEventListener('click', function (event) {
            gearPicker.show(sequenceEditor.addGear.bind(sequenceEditor), sequenceEditor.addButtonContainer);
        });
        this.animateCheckbox.addEventListener('change', function () { sequenceEditor.updateAnimation(); });
        this.animateRpmInput.addEventListener('change', function () { sequenceEditor.updateAnimation(); });
        this.animateRpmInput.addEventListener('keyup', function () { sequenceEditor.updateAnimation(); });
        document.getElementById('clear-sequence').addEventListener('click', this.clear.bind(this));
        document.getElementById('reverse').addEventListener('click', this.reverse.bind(this));
    }
    updateDom() {
        this.startFractionContainer.innerText = '';
        this.startFractionContainer.appendChild(this.startFraction.createDiv());
        this.resultFractionContainer.innerText = '';
        if (this.connections.length >= 1) {
            this.resultFractionContainer.appendChild(this.resultFraction.createDiv());
        }
    }
    addGear(gear) {
        if (this.danglingGear == null) {
            this.danglingGear = gear;
            const div = new Connection(gear, 1).createDiv();
            div.classList.add('hide-second');
            if (this.connections.length >= 1) {
                this.connectionContainer.appendChild(this.resultFraction.createDiv());
            }
            this.connectionContainer.appendChild(div);
        }
        else {
            const connection = new Connection(this.danglingGear, gear);
            this.danglingGear = null;
            this.connectionContainer.removeChild(this.connectionContainer.lastChild);
            this.connectionContainer.appendChild(connection.createDiv());
            this.connections.push(connection);
            this.resultFraction = this.resultFraction.multiply(connection.fraction);
            this.updateDom();
        }
        this.updatePermalink();
        this.addButton.focus();
        this.updateAnimation();
    }
    getGears() {
        const gears = [];
        for (const connection of this.connections) {
            gears.push(connection.gear1);
            gears.push(connection.gear2);
        }
        if (this.danglingGear != null) {
            gears.push(this.danglingGear);
        }
        return gears;
    }
    updatePermalink() {
        this.permalink.href = '?seq=' + this.getGears().join(',');
    }
    clear() {
        this.startFraction = new Fraction(1);
        this.resultFraction = new Fraction(1);
        this.danglingGear = null;
        this.connections = [];
        this.updateDom();
        this.connectionContainer.innerText = '';
        this.updatePermalink();
    }
    setSequence(gears) {
        this.clear();
        for (const gear of gears) {
            this.addGear(gear);
        }
    }
    updateAnimation() {
        const animationRotationsPerSecond = this.animateCheckbox.checked ? parseFloat(this.animateRpmInput.value) / 60 : 0;
        for (const connection of this.connections) {
            connection.updateAnimation(animationRotationsPerSecond);
        }
    }
    reverse() {
        this.setSequence(this.getGears().reverse());
    }
    loadUrlParameters(parameters) {
        const gearStrings = parameters["seq"].split(',');
        const gears = [];
        for (const gearString of gearStrings) {
            const gear = parseInt(gearString.trim());
            if (Number.isInteger(gear)) {
                gears.push(gear);
            }
        }
        if (gears.length > 0) {
            this.setSequence(gears);
        }
    }
}
///<reference path="./gears/GearSVGGenerator.ts" />
class GearPicker {
    constructor() {
        this.selectedGear = null;
        this.callback = null;
        this.active = false;
        this.gearInput = null;
        this.gearPreviewContainer = null;
        this.gearCatalog = null;
        this.element = this.prepareElement();
        this.prepareGearCatalog();
        this.element.addEventListener('focusout', function (event) {
            setTimeout(function () {
                const comparePosition = this.element.compareDocumentPosition(document.activeElement);
                if (this.active && comparePosition != 0 && comparePosition != 20) {
                    this.select(null);
                }
            }.bind(this), 0);
        }.bind(this));
        this.element.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        this.gearInput.addEventListener('keyup', function (event) {
            const gear = parseFloat(this.gearInput.value);
            const showPreview = Number.isInteger(gear) && (gear == 1 || gear >= 8);
            this.gearPreviewContainer.style.display = showPreview ? 'block' : 'none';
            this.gearCatalog.style.display = showPreview ? 'none' : 'block';
            if (showPreview) {
                this.gearPreviewContainer.innerText = '';
                if (gear == 1) {
                    this.gearPreviewContainer.appendChild(GearSVGGenerator.createWormGearSVG());
                }
                else if (gear > 7 && gear <= 170) {
                    this.gearPreviewContainer.appendChild(GearSVGGenerator.createGearSVG(gear));
                }
            }
        }.bind(this));
        this.gearInput.addEventListener('keydown', function (event) {
            this.gearPreviewContainer.innerText = '';
            const gear = parseFloat(this.gearInput.value);
            if (event.keyCode == 13 && Number.isInteger(gear) && (gear == 1 || gear >= 8)) {
                this.select(gear);
                event.preventDefault();
            }
        }.bind(this));
        this.gearPreviewContainer.addEventListener('click', function (event) {
            const gear = parseFloat(this.gearInput.value);
            if (Number.isInteger(gear) && (gear == 1 || gear >= 8)) {
                this.select(gear);
            }
        }.bind(this));
    }
    show(callback, parent = null) {
        if (parent !== null) {
            parent.appendChild(this.element);
        }
        this.callback = callback;
        this.element.style.display = 'block';
        this.gearInput.value = '';
        this.gearInput.focus();
        this.gearPreviewContainer.style.display = 'none';
        this.gearCatalog.style.display = 'block';
        this.active = true;
    }
    select(gear) {
        this.active = false;
        this.element.style.display = 'none';
        document.body.appendChild(this.element);
        this.selectedGear = gear;
        if (gear !== null && this.callback !== null) {
            this.callback(gear);
        }
    }
    prepareElement() {
        const element = document.createElement('div');
        element.classList.add('gear-selector');
        element.setAttribute('tabindex', "0");
        element.style.display = 'none';
        this.gearInput = document.createElement('input');
        this.gearInput.type = 'text';
        this.gearInput.placeholder = 'number of teeth';
        element.appendChild(this.gearInput);
        this.gearPreviewContainer = document.createElement('div');
        this.gearPreviewContainer.classList.add('catalog-gear');
        this.gearPreviewContainer.style.display = 'none';
        element.appendChild(this.gearPreviewContainer);
        this.gearCatalog = document.createElement('div');
        this.gearCatalog.classList.add('catalog');
        element.appendChild(this.gearCatalog);
        return element;
    }
    prepareGearCatalog() {
        const sequenceEditor = this;
        for (const gear of [1, 8, 16, 24, 40, 12, 20, 28, 36, 56, 60]) {
            const span = document.createElement('span');
            span.classList.add('catalog-gear');
            if (gear == 1) {
                span.appendChild(GearSVGGenerator.createWormGearSVG());
            }
            else {
                span.appendChild(GearSVGGenerator.createGearSVG(gear));
            }
            const teethDiv = document.createElement('div');
            teethDiv.classList.add('teeth');
            teethDiv.innerText = gear.toString();
            span.appendChild(teethDiv);
            span.addEventListener('click', function (event) {
                this.select(gear);
            }.bind(this));
            this.gearCatalog.appendChild(span);
        }
    }
}
///<reference path="./model/MunkresAlgorithm.ts" />
///<reference path="./ui/tabs/SearchTab.ts" />
///<reference path="./ui/tabs/FitGears.ts" />
///<reference path="./ui/tabs/SequenceEditor.ts" />
///<reference path="./ui/GearPicker.ts" />
if (typeof document !== 'undefined') { // This is not run in worker threads
    var searchTab = new SearchTab();
    var fitGears = new FitGears();
    var sequenceEditor = new SequenceEditor(document.getElementById('sequence-editor'));
    var gearPicker = new GearPicker();
    function loadUrlParameters() {
        const parameters = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
            parameters[key] = decodeURI(value);
            return '';
        });
        if ("seq" in parameters) {
            document.getElementById('tab-edit').checked = true;
            sequenceEditor.loadUrlParameters(parameters);
        }
        else if ("targetratio" in parameters) {
            document.getElementById('tab-search').checked = true;
            searchTab.loadUrlParameters(parameters);
        }
    }
    loadUrlParameters();
    window.onpopstate = function (event) {
        searchTab.stopSearch();
        loadUrlParameters();
    };
}
function getGearProduct(domain, gearCounts) {
    let result = 1;
    for (let i = 0; i < domain.length; i++) {
        result *= Math.pow(domain[i], gearCounts[i]);
    }
    return result;
}
// Converts the domain + counts representation to a list of actual gears (that includes duplicates)
function getGears(domain, gearCounts) {
    const result = [];
    for (let i = 0; i < domain.length; i++) {
        for (let j = 0; j < gearCounts[i]; j++) {
            result.push(domain[i]);
        }
    }
    return result;
}
function getGearFactorsSet(gears, gearFactors) {
    const gearFactorsSet = new Set();
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
function* getHammingSequence(bases) {
    const queues = {};
    for (const base of bases) {
        queues[base] = [];
    }
    let nextResult = 1;
    while (true) {
        yield nextResult;
        for (const base in queues) {
            queues[base].push(nextResult * Number.parseInt(base));
        }
        let smallestNextQueueItem = null;
        for (const base in queues) {
            if (smallestNextQueueItem == null || queues[base][0] < smallestNextQueueItem) {
                smallestNextQueueItem = queues[base][0];
            }
        }
        nextResult = smallestNextQueueItem;
        for (const base in queues) {
            if (queues[base][0] == nextResult) {
                queues[base].shift();
            }
        }
    }
}
// Returns a list of gear multisets that can be made with availableGears and have a teeth product equal to target
function findGears(target, availableGears, gearFactors) {
    if (target == 1) {
        return [[]];
    }
    const targetFactors = factorize(target);
    const domain = []; // Gears used, will be a subset of availableGears, indices will refer to the order in this array.
    const gearMaxCounts = [];
    const availableFactors = new Set();
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
        let maxOccurances = null;
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
        if (maxOccurances > 0) {
            domain.push(gear);
            gearMaxCounts.push(maxOccurances);
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
function* findGearSequences(searchRatio, availableGears, availableGearsPrimary, availableGearsSecondary, gearFactors) {
    const availableFactors = getGearFactorsSet(availableGears, gearFactors);
    const hammingIterator = getHammingSequence(Array.from(availableFactors));
    while (true) {
        const currentRatio = searchRatio.extend(hammingIterator.next().value);
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
function* findSolutionsExact(parameters) {
    if (parameters.excludePairsWithFixedGears) {
        var availableGearsPrimary = parameters.gears.filter(gear => !parameters.fixedSecondary.includes(gear));
        var availableGearsSecondary = parameters.gears.filter(gear => !parameters.fixedPrimary.includes(gear));
    }
    else {
        var availableGearsPrimary = parameters.gears;
        var availableGearsSecondary = parameters.gears;
    }
    const iterator = findGearSequences(parameters.searchRatio, parameters.gears, availableGearsPrimary, availableGearsSecondary, parameters.gearFactors);
    while (true) {
        yield iterator.next().value;
    }
}
function* findSolutionsApproximate(parameters) {
    const targetRatio = parameters.searchRatio.getDecimal();
    if (parameters.excludePairsWithFixedGears) {
        var availableGearsPrimary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedSecondary.includes(gear));
        var availableGearsSecondary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedPrimary.includes(gear));
    }
    else {
        var availableGearsPrimary = parameters.gears.filter(gear => gear != 1);
        var availableGearsSecondary = availableGearsPrimary;
    }
    const hammingIterator = getHammingSequence(availableGearsPrimary);
    while (true) {
        const primaryValue = hammingIterator.next().value;
        const solutionsPrimary = findGears(primaryValue, availableGearsPrimary, parameters.gearFactors);
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
                const solutionsSecondary = findGears(secondaryValue, remainingGears, parameters.gearFactors);
                for (const solutionSecondary of solutionsSecondary) {
                    yield [solutionPrimary, solutionSecondary];
                }
            }
        }
    }
}
function prepareResult(unorderedGears, parameters) {
    // gearsPrimary and gearsSecondary contain gears decided by the algorithm.
    // In addition to that, the result will contain the fixed start and end gear sequences set by the user.
    // There are three types of gear pairs: fixed and fixed, fixed and decided (at the end/beginning of an odd sized fixed sequence)
    // and pairs completely decided by the algorithm. Only th completely decided pairs can be reordered.
    var [gearsPrimary, gearsSecondary] = unorderedGears;
    if ((!parameters.gears.includes(1) && gearsPrimary.length + parameters.fixedPrimary.length != gearsSecondary.length + parameters.fixedSecondary.length)
        || (parameters.excludePairsWithFixedGears && parameters.fixedPrimary.includes(1) && gearsPrimary.length + parameters.fixedPrimary.length > gearsSecondary.length + parameters.fixedSecondary.length)
        || (parameters.excludePairsWithFixedGears && parameters.fixedSecondary.includes(1) && gearsPrimary.length + parameters.fixedPrimary.length < gearsSecondary.length + parameters.fixedSecondary.length)) {
        return null;
    }
    // Add worm gears if needed
    while (gearsPrimary.length + parameters.fixedPrimary.length < gearsSecondary.length + parameters.fixedSecondary.length) {
        gearsPrimary.push(1);
    }
    while (gearsPrimary.length + parameters.fixedPrimary.length > gearsSecondary.length + parameters.fixedSecondary.length) {
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
    const costMatrix = [];
    for (const gear1 of gearsPrimary) {
        const row = [];
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
    const sequenceStart = [];
    const sequenceReorderable = [];
    const sequenceEnd = [];
    for (let i = 0; i < parameters.startSequence.length - 1; i += 2) {
        sequenceStart.push([parameters.startSequence[i], parameters.startSequence[i + 1]]);
    }
    for (const [index1, index2] of assignments) {
        if (costMatrix[index1][index2] == ASSIGNMENT_COST_FORBIDDEN) {
            return null;
        }
        const gearPair = [gearsPrimary[index1], gearsSecondary[index2]];
        if (parameters.startSequence.length % 2 == 1 && index1 == lastItemIndex) {
            sequenceStart.push(gearPair); // append at the end
        }
        else if (parameters.endSequence.length % 2 == 1 && index2 == lastItemIndex) {
            sequenceEnd.push(gearPair); // insert at the start
        }
        else {
            sequenceReorderable.push(gearPair); // order doesn't matter here
        }
    }
    for (let i = parameters.endSequence.length % 2; i < parameters.endSequence.length; i += 2) {
        sequenceEnd.push([parameters.endSequence[i], parameters.endSequence[i + 1]]);
    }
    sequenceReorderable.sort(function (a, b) { return Math.sign(a[0] / a[1] - b[0] / b[1]); });
    return sequenceStart.concat(sequenceReorderable, sequenceEnd);
}
self.onmessage = function (event) {
    const task = event.data;
    task.targetRatio = new Fraction(task.targetRatio.a, task.targetRatio.b);
    task.searchRatio = new Fraction(task.searchRatio.a, task.searchRatio.b);
    let useDifferentials = false;
    if (task.exact) {
        const availableFactors = getGearFactorsSet(task.gears, task.gearFactors);
        useDifferentials = !canBeMadeWithFactors(task.searchRatio.a, availableFactors) || !canBeMadeWithFactors(task.searchRatio.b, availableFactors);
    }
    if (useDifferentials) {
        let iterator = findSolutionsWithDifferential(task);
        while (true) {
            const unorderedGears = iterator.next().value;
            const orderedGears = prepareResultWithDifferential(unorderedGears, task);
            if (orderedGears != null) {
                const workerGlobalContext = self;
                workerGlobalContext.postMessage({
                    id: task.id,
                    sequence: orderedGears,
                    usesDifferential: true
                });
            }
        }
    }
    else {
        let iterator = task.exact ? findSolutionsExact(task) : findSolutionsApproximate(task);
        while (true) {
            const unorderedGears = iterator.next().value;
            const orderedGears = prepareResult(unorderedGears, task);
            if (orderedGears != null) {
                const workerGlobalContext = self;
                workerGlobalContext.postMessage({
                    id: task.id,
                    sequence: orderedGears,
                    usesDifferential: false
                });
            }
        }
    }
};
///<reference path="./worker.ts" />
function findGearsCached(target, availableGears, gearFactors, cache) {
    if (target in cache) {
        return cache[target];
    }
    cache[target] = findGears(target, availableGears, gearFactors);
    return cache[target];
}
function canBeMadeWithFactors(target, availableFactors) {
    const requiredFactors = factorize(target);
    for (var i = 0; i < requiredFactors.length; i++) {
        if (requiredFactors[i] > 0 && !availableFactors.has(i + 2)) {
            return false;
        }
    }
    return true;
}
function* getCombinations(count1, count2, count3, count4) {
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
function* findSolutionsWithDifferential(task) {
    var primaryTarget = task.searchRatio.a;
    var secondaryTarget = task.searchRatio.b;
    const availableFactors = getGearFactorsSet(task.gears, task.gearFactors);
    const hammingIterator = getHammingSequence(Array.from(availableFactors));
    const wormGearAvailable = task.gears.includes(1);
    const usePrimaryDifferential = !canBeMadeWithFactors(primaryTarget, availableFactors);
    const useSecondaryDifferential = !canBeMadeWithFactors(secondaryTarget, availableFactors);
    const findGearsCache = {};
    while (true) {
        const extension = hammingIterator.next().value;
        var offsets = [];
        for (var totalOffset = 0; totalOffset < Math.max(primaryTarget, secondaryTarget) * extension; totalOffset++) {
            if (!usePrimaryDifferential) {
                offsets.push([0, totalOffset]);
            }
            else if (!useSecondaryDifferential) {
                offsets.push([totalOffset, 0]);
            }
            else {
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
                // TODO skip if a gear is in all four lists
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
function getMostCommonGear(value) {
    var candidates = new Set(value.left1.concat(value.left2, value.right1, value.right2));
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
function removeFromArray(array, itemToRemove) {
    if (array.includes(itemToRemove)) {
        array.splice(array.indexOf(itemToRemove), 1);
    }
}
function removeOne(gear, value) {
    removeFromArray(value.left1, gear);
    removeFromArray(value.left2, gear);
    removeFromArray(value.right1, gear);
    removeFromArray(value.right2, gear);
}
function removeEqualPairs(sequence) {
    for (var i = 0; i < sequence[0].length;) {
        if (sequence[1].includes(sequence[0][i])) {
            removeFromArray(sequence[1], sequence[0][i]);
            sequence[0].splice(i, 1);
        }
        else {
            i++;
        }
    }
}
function getSharedGears(list1, list2) {
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
function moveSharedPairs(primarySequence, secondarySequence, sharedSequence) {
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
function prepareResultWithDifferential(unorderedGears, task) {
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
    var primaryLeft = [unorderedGears.left1.slice(), gearsToAdd.slice()];
    var secondaryLeft = [unorderedGears.left2.slice(), gearsToAdd.slice()];
    var primaryRight = [gearsToAdd.slice(), unorderedGears.right1.slice()];
    var secondaryRight = [gearsToAdd.slice(), unorderedGears.right2.slice()];
    var sharedSequence = [[], []];
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
    };
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function greatestCommonDenominator(a, b) {
    if (b == 0) {
        return a;
    }
    else {
        return greatestCommonDenominator(b, a % b);
    }
}
function getOnCircle(angle, radius) {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}
function isApproximatelyInteger(number) {
    return Math.abs(number - Math.round(number)) < 1e-8;
}
function factorize(number) {
    const result = [];
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
class Solution {
    constructor() {
        this.error = 0;
        this.connections = [];
        this.domObject = null;
    }
    updateAnimation(rotationsPerSecond) {
        for (let connection of this.connections) {
            connection.updateAnimation(rotationsPerSecond);
        }
    }
}
class SequenceSolution extends Solution {
    constructor(sequence, task) {
        super();
        this.task = task;
        this.sequence = sequence;
        this.numberOfGears = sequence.length * 2;
        if (!this.task.exact) {
            this.error = Math.abs(getRatio(sequence).getDecimal() / this.task.targetRatio.getDecimal() - 1);
        }
    }
    createDiv() {
        const solutionDiv = document.createElement("div");
        solutionDiv.classList.add("solution");
        const div = document.createElement("div");
        div.classList.add("sequence");
        var ratio = new Fraction(1);
        div.appendChild(ratio.createDiv());
        for (let i = 0; i < this.sequence.length; i++) {
            var connection = new Connection(this.sequence[i][0], this.sequence[i][1]);
            connection.rotationSpeed = ratio.getDecimal() * (i % 2 == 0 ? 1 : -1);
            this.connections.push(connection);
            div.appendChild(connection.createDiv());
            ratio = ratio.multiply(connection.fraction);
            div.appendChild(ratio.createDiv());
            if (i * 2 < this.task.startSequence.length) {
                connection.svg1.classList.add("fixed");
            }
            if (i * 2 + 1 < this.task.startSequence.length) {
                connection.svg2.classList.add("fixed");
            }
            if (i * 2 >= this.connections.length * 2 - this.task.endSequence.length) {
                connection.svg1.classList.add("fixed");
            }
            if (i * 2 + 1 >= this.connections.length * 2 - this.task.endSequence.length) {
                connection.svg2.classList.add("fixed");
            }
        }
        solutionDiv.appendChild(div);
        let infoDiv = document.createElement("div");
        infoDiv.classList.add("info");
        solutionDiv.appendChild(infoDiv);
        if (!this.task.exact) {
            const errorSpan = document.createElement('span');
            errorSpan.innerText = 'Error: ' + this.error.toPrecision(3) + ' ';
            infoDiv.appendChild(errorSpan);
        }
        const permalink = document.createElement('a');
        permalink.innerText = 'Permalink';
        permalink.title = 'Permanent link to this solution';
        permalink.href = this.getPermalink();
        infoDiv.appendChild(permalink);
        this.domObject = solutionDiv;
        return solutionDiv;
    }
    getPermalink() {
        const gears = [];
        for (const connection of this.connections) {
            gears.push(connection.gear1);
            gears.push(connection.gear2);
        }
        return '?seq=' + gears.join(',');
    }
}
function getRatio(gears) {
    let a = 1;
    let b = 1;
    for (let [gear1, gear2] of gears) {
        a *= gear1;
        b *= gear2;
    }
    return new Fraction(a, b);
}
class DifferentialSolution extends Solution {
    constructor(data, task) {
        super();
        this.data = data;
        this.task = task;
        this.numberOfGears = (data.primaryLeft.length + data.secondaryLeft.length + data.primaryRight.length + data.secondaryRight.length + data.sharedSequence.length) * 2;
        if (data.primaryLeft.length != 0 || data.secondaryLeft.length != 0) {
            this.numberOfGears += 4;
        }
        if (data.primaryRight.length != 0 || data.secondaryRight.length != 0) {
            this.numberOfGears += 4;
        }
    }
    addSequence(gears, target, ratio) {
        let index = 0;
        for (let [gear1, gear2] of gears) {
            const connection = new Connection(gear1, gear2);
            connection.rotationSpeed = ratio.getDecimal() * (index % 2 == 0 ? 1 : -1);
            index++;
            this.connections.push(connection);
            target.appendChild(connection.createDiv());
            ratio = ratio.multiply(connection.fraction);
            target.appendChild(ratio.createDiv());
        }
    }
    createDifferentialCasing() {
        var differentialDiv = document.createElement("div");
        differentialDiv.classList.add("connection");
        differentialDiv.appendChild(DifferentialCasingSVGGenerator.createDifferentialCasing());
        var descriptionDiv = document.createElement("div");
        descriptionDiv.classList.add("distance");
        descriptionDiv.innerText = "Differential Casing";
        differentialDiv.appendChild(descriptionDiv);
        return differentialDiv;
    }
    createDiv() {
        const solutionDiv = document.createElement("div");
        solutionDiv.classList.add("solution");
        const div = document.createElement("div");
        div.classList.add("sequence");
        var ratio = new Fraction(1);
        if (this.data.primaryLeft.length != 0 || this.data.secondaryLeft.length != 0) {
            var doubleSequenceDiv = document.createElement("div");
            doubleSequenceDiv.classList.add("double-sequence");
            doubleSequenceDiv.classList.add("left");
            var primarySequenceDiv = document.createElement("div");
            primarySequenceDiv.appendChild(ratio.createDiv());
            this.addSequence(this.data.primaryLeft, primarySequenceDiv, ratio);
            doubleSequenceDiv.appendChild(primarySequenceDiv);
            var separator = document.createElement("div");
            separator.classList.add("separator");
            doubleSequenceDiv.appendChild(separator);
            var secondarySequenceDiv = document.createElement("div");
            secondarySequenceDiv.appendChild(ratio.createDiv());
            this.addSequence(this.data.secondaryLeft, secondarySequenceDiv, ratio);
            doubleSequenceDiv.appendChild(secondarySequenceDiv);
            div.appendChild(doubleSequenceDiv);
            div.appendChild(this.createDifferentialCasing());
            ratio = ratio.multiply(getRatio(this.data.primaryLeft).add(getRatio(this.data.secondaryLeft)).divideByFactor(2));
            div.appendChild(ratio.createDiv());
        }
        else {
            div.appendChild(ratio.createDiv());
        }
        if (this.data.sharedSequence.length != 0) {
            this.addSequence(this.data.sharedSequence, div, ratio);
            ratio = ratio.multiply(getRatio(this.data.sharedSequence));
        }
        if (this.data.primaryRight.length != 0 || this.data.secondaryRight.length != 0) {
            div.appendChild(this.createDifferentialCasing());
            var primarySequenceRatio = getRatio(this.data.primaryRight);
            var secondarySequenceRatio = getRatio(this.data.secondaryRight);
            var offset = ratio.multiply(primarySequenceRatio).subtract(ratio.multiply(secondarySequenceRatio)).divide(primarySequenceRatio.add(secondarySequenceRatio));
            var ratio1 = ratio.subtract(offset);
            var ratio2 = ratio.add(offset);
            var doubleSequenceDiv = document.createElement("div");
            doubleSequenceDiv.classList.add("double-sequence");
            var primarySequenceDiv = document.createElement("div");
            primarySequenceDiv.appendChild(ratio1.createDiv());
            this.addSequence(this.data.primaryRight, primarySequenceDiv, ratio1);
            doubleSequenceDiv.appendChild(primarySequenceDiv);
            var separator = document.createElement("div");
            separator.classList.add("separator");
            doubleSequenceDiv.appendChild(separator);
            var secondarySequenceDiv = document.createElement("div");
            secondarySequenceDiv.appendChild(ratio2.createDiv());
            this.addSequence(this.data.secondaryRight, secondarySequenceDiv, ratio2);
            doubleSequenceDiv.appendChild(secondarySequenceDiv);
            div.appendChild(doubleSequenceDiv);
        }
        solutionDiv.appendChild(div);
        this.domObject = solutionDiv;
        return solutionDiv;
    }
}
//# sourceMappingURL=app.js.map