///<reference path="./model/MunkresAlgorithm.ts" />
///<reference path="./ui/tabs/SearchTab.ts" />
///<reference path="./ui/tabs/FitGears.ts" />
///<reference path="./ui/tabs/SequenceEditor.ts" />
///<reference path="./ui/GearPicker.ts" />

if (typeof document !== 'undefined') { // This is not run in worker threads
    var searchTab = new SearchTab();
    var fitGears = new FitGears();
    var sequenceEditor = new SequenceEditor(document.getElementById('sequence-editor') as HTMLDivElement);
    var gearPicker = new GearPicker();
    
    function loadUrlParameters() {
        const parameters: ParsedUrlParameters = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m: string, key: string, value: string) {
            parameters[key] = decodeURI(value);
            return '';
        });
    
        if ("seq" in parameters) {
            (document.getElementById('tab-edit') as HTMLInputElement).checked = true;
            sequenceEditor.loadUrlParameters(parameters);
        } else if ("targetratio" in parameters) {
            (document.getElementById('tab-search') as HTMLInputElement).checked = true;        
            searchTab.loadUrlParameters(parameters);
        }
    }

    loadUrlParameters();

    window.onpopstate = function(event: PopStateEvent) {
        searchTab.stopSearch();
        loadUrlParameters();
    }
}