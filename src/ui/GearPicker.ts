///<reference path="./gears/GearSVGGenerator.ts" />

type GearPickerCallback = (gear: number) => void;

class GearPicker {
    public selectedGear: number | null = null;
    private callback: GearPickerCallback | null = null;
    private active: boolean = false;

    private readonly element: HTMLDivElement;
    private gearInput: HTMLInputElement | null = null;
    private gearPreviewContainer: HTMLDivElement | null = null;
    private gearCatalog: HTMLDivElement | null = null;

    constructor() {
        this.element = this.prepareElement();
        this.prepareGearCatalog();

        this.element.addEventListener('focusout', function(this: GearPicker, event: FocusEvent) {
            setTimeout(function(this: GearPicker) {
                var comparePosition = this.element.compareDocumentPosition(document.activeElement!);
                if (this.active && comparePosition != 0 && comparePosition != 20) {
                    this.select(null);
                }
            }.bind(this), 0);
        }.bind(this));

        this.element.addEventListener('click', function(event: MouseEvent) {
            event.stopPropagation();
        });

        this.gearInput!.addEventListener('keyup', function(this: GearPicker, event: KeyboardEvent) {
            var gear = parseFloat(this.gearInput!.value);
            var showPreview = Number.isInteger(gear) && (gear == 1 || gear >= 8);

            this.gearPreviewContainer!.style.display = showPreview ? 'block' : 'none';
            this.gearCatalog!.style.display =  showPreview ? 'none' : 'block';

            if (showPreview) {
                this.gearPreviewContainer!.innerText = '';
                if (gear == 1) {
                    this.gearPreviewContainer!.appendChild(GearSVGGenerator.createWormGearSVG());
                } else if (gear > 7 && gear <= 170) {
                    this.gearPreviewContainer!.appendChild(GearSVGGenerator.createGearSVG(gear));
                }
            }
        }.bind(this));

        this.gearInput!.addEventListener('keydown', function(this: GearPicker, event: KeyboardEvent) {
            this.gearPreviewContainer!.innerText = '';
            var gear = parseFloat(this.gearInput!.value);
            if (event.keyCode == 13 && Number.isInteger(gear) && (gear == 1 || gear >= 8)) {
                this.select(gear);
                event.preventDefault();
            }
        }.bind(this));

        this.gearPreviewContainer!.addEventListener('click', function(this: GearPicker, event: MouseEvent) {
            var gear = parseFloat(this.gearInput!.value);
            if (Number.isInteger(gear) && (gear == 1 || gear >= 8)) {
                this.select(gear);
            }
        }.bind(this));
    }

    public show(callback: GearPickerCallback, parent: HTMLSpanElement | null=null) {
        if (parent !== null) {
            parent.appendChild(this.element);            
        }

        this.callback = callback;
        this.element.style.display = 'block';
        this.gearInput!.value = '';
        this.gearInput!.focus();
        this.gearPreviewContainer!.style.display = 'none';
        this.gearCatalog!.style.display = 'block';
        this.active = true;
    }

    private select(gear: number | null) {
        this.active = false;
        this.element.style.display = 'none';
        document.body.appendChild(this.element);
        this.selectedGear = gear;

        if (gear !== null && this.callback !== null) {
            this.callback(gear);
        }
    }

    private prepareElement() {
        var element = document.createElement('div');
        element.classList.add('gear-selector');
        element.setAttribute('tabindex', "0");
        element.style.display = 'none';
        this.gearInput = document.createElement('input');
        this.gearInput!.type = 'text';
        this.gearInput!.placeholder = 'number of teeth';
        element.appendChild(this.gearInput);
        this.gearPreviewContainer = document.createElement('div');
        this.gearPreviewContainer!.classList.add('catalog-gear');
        this.gearPreviewContainer!.style.display = 'none';
        element.appendChild(this.gearPreviewContainer);
        this.gearCatalog = document.createElement('div');
        this.gearCatalog!.classList.add('catalog');
        element.appendChild(this.gearCatalog);
        return element;
    }

    private prepareGearCatalog() {
        var sequenceEditor = this;
        for (const gear of [1, 8, 16, 24, 40, 12, 20, 28, 36, 56, 60]) {
            var span = document.createElement('span');
            span.classList.add('catalog-gear');
            if (gear == 1) {
                span.appendChild(GearSVGGenerator.createWormGearSVG());
            } else {
                span.appendChild(GearSVGGenerator.createGearSVG(gear));
            }
            var teethDiv = document.createElement('div');
            teethDiv.classList.add('teeth');
            teethDiv.innerText = gear.toString();
            span.appendChild(teethDiv);
            
            span.addEventListener('click', function (this: GearPicker, event: MouseEvent) {
                this.select(gear);
            }.bind(this));

            this.gearCatalog!.appendChild(span);
        }
    }
}

if (typeof document !== 'undefined') {
    var gearPicker = new GearPicker();
}