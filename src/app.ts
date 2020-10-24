///<reference path="./ui/tabs/SearchTab.ts" />
///<reference path="./ui/tabs/FitGears.ts" />
///<reference path="./ui/tabs/SequenceEditor.ts" />

if (typeof document !== 'undefined') { // This is not run in worker threads
    var searchTab = new SearchTab();
    var fitGears = new FitGears();
    var sequenceEditor = new SequenceEditor(document.getElementById('sequence-editor') as HTMLDivElement);
    searchTab.loadUrlParameters();
}