class FitGears {
    private gear1: number | null = null;
    private gear2: number | null = null;

    private readonly gear1Button: HTMLButtonElement;
    private readonly gear2Button: HTMLButtonElement;
    private readonly resultsContainer: HTMLDivElement;
    private readonly includeHalfUnitsCheckbox: HTMLInputElement;
    private readonly maximumErrorTextbox: HTMLInputElement;

    private suppressUpdate: boolean = false;

    constructor() {
        this.gear1Button = document.getElementById("gear-button1") as HTMLButtonElement;
        this.gear2Button = document.getElementById("gear-button2") as HTMLButtonElement;

        this.resultsContainer = document.getElementById('fit-results-container') as HTMLDivElement;

        this.gear1Button.addEventListener("click", function(this: FitGears, event: MouseEvent) {
            gearPicker.show(this.updateGear1.bind(this), this.gear1Button);
        }.bind(this));

        this.gear2Button.addEventListener("click", function(this: FitGears, event: MouseEvent) {
            gearPicker.show(this.updateGear2.bind(this), this.gear2Button);
        }.bind(this));

        this.includeHalfUnitsCheckbox = document.getElementById('fit-half') as HTMLInputElement;
        this.includeHalfUnitsCheckbox.addEventListener("change", this.update.bind(this));

        this.maximumErrorTextbox = document.getElementById('fit-error') as HTMLInputElement;
        this.maximumErrorTextbox.value = DEFAULT_FIT_ERROR.toString();
        this.maximumErrorTextbox.addEventListener("change", this.update.bind(this));

        this.suppressUpdate = true;

        this.updateGear1(40);
        this.updateGear2(28);

        document.getElementById("form-fit-gears")!.addEventListener("submit", function(event) {event.preventDefault();});
    
        this.suppressUpdate = false;
        this.update();
    }

    private updateGear1(gear: number) {
        this.gear1 = gear;
        this.gear1Button.innerText = '';
        this.gear1Button.appendChild(GearSVGGenerator.createGearSVG(gear));
        var description = document.createElement("div");
        description.innerText = gear.toString();
        description.classList.add("fit-gear-teeth");
        this.gear1Button.appendChild(description);

        this.update();
    }

    private updateGear2(gear: number) {
        this.gear2 = gear;
        this.gear2Button.innerText = '';
        this.gear2Button.appendChild(GearSVGGenerator.createGearSVG(gear));
        var description = document.createElement("div");
        description.innerText = gear.toString();
        description.classList.add("fit-gear-teeth");
        this.gear2Button.appendChild(description);

        this.update();
    }

    public showConnection(gear1: number, gear2: number, includeHalfUnits: boolean) {
        this.suppressUpdate = true;
        this.updateGear1(gear1);
        this.updateGear2(gear2);
        this.includeHalfUnitsCheckbox.checked = includeHalfUnits;
        this.maximumErrorTextbox.value = DEFAULT_FIT_ERROR.toString();

        (document.getElementById("tab-fit") as HTMLInputElement).checked = true;
        this.suppressUpdate = false;
        this.update();
    }

    private update() {
        if (this.suppressUpdate || this.gear1 == null || this.gear2 == null) {
            return;
        }

        var maxError = Number.parseFloat(this.maximumErrorTextbox.value) / 8;

        var radius1 = this.gear1 / 16;
        var radius2 = this.gear2 / 16;

        if (this.gear1 == 140) {
            radius1 -= radius2 * 2;
        } else if (this.gear2 == 140) {
            radius2 -= radius1 * 2;
        }

        var targetDistance = radius1 + radius2;

        this.resultsContainer.innerText = '';

        if (this.gear1 == 1 || this.gear2 == 1) {
            return;
        }

        var step = this.includeHalfUnitsCheckbox.checked ? 0.5 : 1.0;

        var foundAnything = false;

        if ((this.gear1 - 4) % 8 == 0 && (this.gear2 - 4) % 8 == 0) {
            var resultElement = document.createElement('div');
            resultElement.classList.add('sequence');
            resultElement.innerText = "These gears can be connected using perpendicular axles.";
            this.resultsContainer.appendChild(resultElement);
            foundAnything = true;
        }

        for (var y = 0; y <= Math.ceil(targetDistance); y += step) {
            var x = Math.round((Math.sqrt(Math.pow(targetDistance, 2) - Math.pow(y, 2))) / step) * step;
            if (Number.isNaN(x) || x < y) {
                continue;
            }

            var totalDistance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            var error = totalDistance - targetDistance;
            if (Math.abs(error) > maxError) {
                continue;
            }
            var angle = Math.atan2(y, x);

            foundAnything = true;

            var resultElement = document.createElement('div');
            resultElement.classList.add('sequence');

            var fitBox = document.createElement('div');
            fitBox.classList.add('fit-box');

            var margin = 1.5 * 8 * PIXELS_PER_MM;

            var gearSVG1 = GearSVGGenerator.createGearSVG(this.gear1);
            var svgSize1 = gearSVG1.width.baseVal.value;
            gearSVG1.style.left = (margin - svgSize1 / 2) + "px";
            gearSVG1.style.top = (margin - svgSize1 / 2) + "px";

            fitBox.appendChild(gearSVG1);
            
            var gearSVG2 = GearSVGGenerator.createGearSVG(this.gear2);
            var svgSize2 = gearSVG2.width.baseVal.value;
            gearSVG2.style.left = (margin + x * 8 * PIXELS_PER_MM - svgSize2 / 2) + "px";
            gearSVG2.style.top = (margin + y * 8 * PIXELS_PER_MM - svgSize2 / 2) + "px";
            fitBox.appendChild(gearSVG2);
            
            var gear1ToothPosition = (angle / (2 * Math.PI) * this.gear1) % 1;
            var gear2ToothPosition = ((angle + Math.PI) / (2 * Math.PI) * this.gear2) % 1;

            if (this.gear1 == 140 || this.gear2 == 140) {
                gear1ToothPosition = 1.0 - gear1ToothPosition;
            }

            var gear2ToothCorrection = (gear1ToothPosition + gear2ToothPosition + 0.5) % 1;
            var gear2AngleCorrectionDegree = gear2ToothCorrection / this.gear2 * 360;
            gearSVG2.style.transform = 'rotate(' + gear2AngleCorrectionDegree + 'deg)';
            
            for (var a = 0; a <= Math.ceil(x); a++) {
                for (var b = 0; b <= Math.ceil(y); b++) {
                    var holeElement = document.createElement('div');
                    holeElement.classList.add('hole');
                    holeElement.style.left = (margin - 2 + a * 8 * PIXELS_PER_MM) + "px";
                    holeElement.style.top = (margin - 2 + b * 8 * PIXELS_PER_MM) + "px";
                    fitBox.appendChild(holeElement);
                }
            }
            var radius1 = this.gear1 / 16;
            var radius2 = this.gear2 / 16;

            fitBox.style.width = (x * 8 * PIXELS_PER_MM + margin + Math.max(margin, radius2 * 8 * PIXELS_PER_MM + 20)) + "px";
            fitBox.style.height = (y * 8 * PIXELS_PER_MM + margin + Math.max(margin, radius2 * 8 * PIXELS_PER_MM + 20)) + "px";          

            resultElement.appendChild(fitBox);

            var resultText = document.createElement('div');

            if (this.gear1 == 140 || this.gear2 == 140) {
                error *= -1;
            }

            var distancesSpan = document.createElement("span");
            distancesSpan.innerText = x + " ✕ " + y;            
            if (x % 1 == 0 && y % 1 == 0) {
                distancesSpan.classList.add("result-good");
            } else {
                distancesSpan.classList.add("result-ok");
            }
            resultText.appendChild(distancesSpan);

            var errorSpan = document.createElement("span");
            if (error == 0) {
                errorSpan.innerText =  " (exact fit)";
                errorSpan.classList.add("result-good");
            } else {
                errorSpan.innerText = ", distance: " + (Math.round(totalDistance * 100) / 100) + " / " + targetDistance + ", error: " + (Math.round(Math.abs(error) * 1000) / 1000) + " units (" + (Math.round(Math.abs(error) * 8 * 100) / 100) + "mm) " + (error < 0 ? "too close" : "too far");
            }
            resultText.appendChild(errorSpan);

            resultElement.appendChild(resultText);
            this.resultsContainer.appendChild(resultElement);
        }

        if (!foundAnything) {
            this.resultsContainer.innerText = "Nothing found.";
        }
    }
}