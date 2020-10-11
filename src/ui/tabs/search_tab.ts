type SearchParameters = {
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

if (typeof document !== 'undefined') { // This is not run in worker threads
    var resultDiv: HTMLDivElement = document.getElementById("result") as HTMLDivElement;
    var searchingSpan: HTMLSpanElement = document.getElementById("searching") as HTMLSpanElement;

    var currentWorker: Worker | null = null;

    var currentTask: SearchParameters;
    var currentTaskId = 0;
    
    var animationSettings: AnimationSettings = { enabled: false, duration: 0};

    function getAvailableGears() {
        var result: number[] = [];
    
        if ((document.getElementById('standardgearscheckbox') as HTMLInputElement).checked) {
            result = result.concat(parseGearList((document.getElementById('standardgearslist') as HTMLInputElement).value, true));
        }
    
        if ((document.getElementById('customgearscheckbox') as HTMLInputElement).checked) {
            result = result.concat(parseGearList((document.getElementById('customgearslist') as HTMLInputElement).value, true));
        }
    
        return result;
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

    function onReceiveWorkerMessage(this: Worker, event: MessageEvent) {
        if (event.data.type == 'solution' && event.data.id == currentTaskId) {
            var sequence = createSequence(event.data.gearsPrimary, event.data.gearsSecondary, currentTask);
            currentTask.solutionList!.add(new Solution(sequence));

            if (currentTask.solutionList!.totalSolutions >= currentTask.maxNumberOfResults) {
                stopSearch();
            }
        }
        if (event.data.type == 'stop' && event.data.id == currentTaskId) {
            searchingSpan.style.display = 'none';
            currentWorker = null;

            if (event.data.reason == 'missingfactors') {
                resultDiv.innerText = '\nNo exact solution is available because these gears are missing:\n\n'
                + event.data.missingFactors.join('\n')
                + '\n\nConsider searching for approximate results.';
            }
        }
    }

    function readFixedSequenceGears(currentTask: SearchParameters) {
        currentTask.startSequence = parseGearList((document.getElementById('fixedStart') as HTMLInputElement).value);
        currentTask.endSequence = parseGearList((document.getElementById('fixedEnd') as HTMLInputElement).value);

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

    function handleTaskTimeout() {
        var taskId = currentTaskId;
        setTimeout(function() {
            if (currentTask.id == taskId && currentWorker != null) {
                stopSearch();
            }
        }, parseInt((document.getElementById('limitTime') as HTMLInputElement).value) * 1000);
    }

    function startSearch() {
        var targetRatio = Fraction.parse((document.getElementById('ratio') as HTMLInputElement).value);
        var distanceConstraint = null;
        if ((document.getElementById('full') as HTMLInputElement).checked) {
            distanceConstraint = 1;
        } else if ((document.getElementById('half') as HTMLInputElement).checked) {
            distanceConstraint = 0.5;
        }
        var approxiamte = (document.getElementById('approximate') as HTMLInputElement).checked;
        var error = parseFloat((document.getElementById('error') as HTMLInputElement).value);

        currentTaskId++;

        if (currentWorker != null) {
            currentWorker.terminate();
        }

        currentWorker = new Worker("app.js");

        currentWorker.onmessage = onReceiveWorkerMessage;

        currentTask = {
            exact: !approxiamte,
            error: error,
            targetRatio: targetRatio,
            gears: getAvailableGears(),
            distanceConstraint: distanceConstraint,
            id: currentTaskId,
            maxNumberOfResults: parseInt((document.getElementById('limitCount') as HTMLInputElement).value),
            excludePairsWithFixedGears: (document.getElementById('exlude-pairs-with-fixed-gears') as HTMLInputElement).checked,
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

        readFixedSequenceGears(currentTask);

        currentWorker.postMessage(currentTask);
        searchingSpan.style.display = "inline";
        currentTask.solutionList = new SolutionList(resultDiv);
        handleTaskTimeout();

        document.getElementById('resultcount')!.innerText = "0";
        document.getElementById('result-meta')!.style.display = 'block';
        document.getElementById('smallest-error-container')!.style.display = currentTask.exact ? 'none' : 'inline';
        document.getElementById('smallest-error')!.innerText = '';
    }

    function stopSearch() {
        if (currentWorker != null) {
            currentWorker.terminate();
            currentWorker = null;
        }

        searchingSpan.style.display = "none";
    }
    
    document.getElementById('calculate')!.addEventListener('click', function(event) {
        event.preventDefault();
        
        startSearch();

        window.history.pushState({}, "", getUrlParameters());
    });

    document.getElementById('stop')!.addEventListener('click', function(event) {
        event.preventDefault();
        stopSearch();        
    });

    var sequenceEditor = new SequenceEditor(document.getElementById('sequence-editor') as HTMLDivElement);
    document.getElementById('clear-sequence')!.addEventListener('click', function(event) {
        sequenceEditor.clear();
    });
    document.getElementById('reverse')!.addEventListener('click', function(event) {
        sequenceEditor.reverse();
    })
    var fitGears = new FitGears();

    function getUrlParameters() {
        var form = document.querySelector('form') as HTMLFormElement;
        var elements: {[name: string]: HTMLInputElement} = {};
    
        var items = [];
        
        for (var element of form.elements) {
            var inputElement = element as HTMLInputElement;
            elements[inputElement.name] = inputElement;
            if (inputElement.type == 'radio' && inputElement.checked) {
                items.push('dst=' + inputElement.value);
            }
        }
    
        items.push('targetratio=' + encodeURI(elements['ratio'].value));
        if (elements['standardgears'].checked) {
            var value = elements['standardgearslist'].value.replace(/ /g, '');
            if (value == DEFAULT_GEARS_STANDARD) {
                value = 'default';
            }
            items.push('gears=' + encodeURI(value));
        }
    
        if (elements['customgears'].checked) {
            var value = elements['customgearslist'].value.replace(/ /g, '');
            if (value == DEFAULT_GEARS_CUSTOM) {
                value = 'default';
            }
            items.push('customgears=' + encodeURI(value));
        }
    
        if (elements['approximate'].checked) {
            items.push('error=' + encodeURI(elements['error'].value));
        }
    
        if (elements['fixedStart'].value != '') {
            items.push('start=' + encodeURI(elements['fixedStart'].value));
        }
    
        if (elements['fixedEnd'].value != '') {
            items.push('end=' + encodeURI(elements['fixedEnd'].value));
        }

        if (elements['exlude-pairs-with-fixed-gears'].checked) {
            items.push('epwfg=' + encodeURI('' + elements['exlude-pairs-with-fixed-gears'].checked));
        }

        if (elements['limitCount'].value != '30') {
            items.push('count=' + encodeURI(elements['limitCount'].value));
        }

        if (elements['limitTime'].value != '30') {
            items.push('time=' + encodeURI(elements['limitTime'].value));
        }
    
        return '?' + items.join('&');
    }
    
    function loadUrlParameters(runSearch=true) {
        var parameters: {[key: string]: string} = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m: string, key: string, value: string) {
            parameters[key] = decodeURI(value);
            return '';
        });

        var advancedOptionsUsed = false;

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
            var form = document.querySelector('form') as HTMLFormElement;
            var elements: {[name: string]: HTMLInputElement } = {};
            
            for (var element of form.elements) {
                elements[(element as HTMLInputElement).name] = element as HTMLInputElement;
            }
            
            elements['ratio'].value = parameters['targetratio'];
    
            if ('dst' in parameters) {
                (document.getElementById(parameters['dst']) as HTMLInputElement).checked = true;
            }
    
            elements['standardgears'].checked = 'gears' in parameters;
            if ('gears' in parameters) {
                if (parameters['gears'] == 'default') {
                    elements['standardgearslist'].value = DEFAULT_GEARS_STANDARD.replace(/,/g, ', ');
                } else {
                    elements['standardgearslist'].value = parameters['gears'].replace(/,/g, ', ');
                }
            }
    
            elements['customgears'].checked = 'customgears' in parameters;
            if ('customgears' in parameters) {
                if (parameters['customgears'] == 'default') {
                    elements['customgearslist'].value = DEFAULT_GEARS_CUSTOM.replace(/,/g, ', ');
                } else {
                    elements['standarcustomgearslistdgearslist'].value = parameters['customgears'].replace(/,/g, ', ');
                }
                advancedOptionsUsed = true;
            }
    
            elements['approximate'].checked = 'error' in parameters;
            if ('error' in parameters) {
                elements['error'].value = parameters['error'];
            }
    
            if ('start' in parameters) {
                elements['fixedStart'].value = parameters['start'];
                advancedOptionsUsed = true;
            } else {
                elements['fixedStart'].value = '';
            }
    
            if ('end' in parameters) {
                elements['fixedEnd'].value = parameters['end'];
                advancedOptionsUsed = true;
            } else {
                elements['fixedEnd'].value = '';
            }

            if ('epwfg' in parameters) {
                elements['exlude-pairs-with-fixed-gears'].checked = parameters['epwfg'] == 'true';
                advancedOptionsUsed = true;
            } else {
                elements['exlude-pairs-with-fixed-gears'].checked = false;
            }
    
            if ('count' in parameters) {
                elements['limitCount'].value = parameters['count'];
                advancedOptionsUsed = true;
            } else {
                elements['limitCount'].value = '30';
            }
    
            if ('time' in parameters) {
                elements['limitTime'].value = parameters['time'];
                advancedOptionsUsed = true;
            } else {
                elements['limitTime'].value = '30';
            }

            if (advancedOptionsUsed) {
                (document.getElementById("advanced-options") as HTMLDetailsElement).open = true;
            }
    
            if (runSearch) {
                startSearch();
            } else {
                resultDiv.innerText = '';
            }
        }
    }

    function updateAnimation() {
        animationSettings.enabled = (document.getElementById('animate') as HTMLInputElement).checked;
        animationSettings.duration = 60 / parseFloat((document.getElementById('animate-rpm') as HTMLInputElement).value);

        if (currentTask != null) {
            currentTask.solutionList!.updateAnimation();
        }
    }

    updateAnimation();

    (document.getElementById('animate') as HTMLInputElement).addEventListener('change', updateAnimation);
    (document.getElementById('animate-rpm') as HTMLInputElement).addEventListener('change', updateAnimation);
    
    loadUrlParameters();

    window.onpopstate = function(event: PopStateEvent) {
        loadUrlParameters(false);
        stopSearch();
    }
}