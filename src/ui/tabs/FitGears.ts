///<reference path="../../config.ts" />
///<reference path="../gears/GearSVGGenerator.ts" />

type HelperGearData = {gear: number, x: number, y: number, distance: number, targetDistance: number};

function getConnectionScore(x: number, y: number): number {
    if (x % 1 == 0 && y % 1 == 0) {
        return 3;
    } else if (x % 1 == 0 || y % 1 == 0) {
        return 1;
    } else {
        return 0;
    }
}

class FitGears {
    private gear1: number | null = null;
    private gear2: number | null = null;

    private readonly gear1Button: HTMLButtonElement;
    private readonly gear2Button: HTMLButtonElement;
    private readonly resultsContainer: HTMLDivElement;
    private readonly includeHalfUnitsCheckbox: HTMLInputElement;
    private readonly maximumErrorTextbox: HTMLInputElement;

    private suppressUpdate: boolean = false;

    private resultElements: Array<[HTMLDivElement, number]> = [];

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
        const description = document.createElement("div");
        description.innerText = gear.toString();
        description.classList.add("fit-gear-teeth");
        this.gear1Button.appendChild(description);

        this.update();
    }

    private updateGear2(gear: number) {
        this.gear2 = gear;
        this.gear2Button.innerText = '';
        this.gear2Button.appendChild(GearSVGGenerator.createGearSVG(gear));
        const description = document.createElement("div");
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

        const maxError = Number.parseFloat(this.maximumErrorTextbox.value) / 8;

        let radius1 = this.gear1 / 16;
        let radius2 = this.gear2 / 16;

        if (this.gear1 == 140) {
            radius1 -= radius2 * 2;
        } else if (this.gear2 == 140) {
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
                    const helperX: number = Math.round((Math.sqrt(Math.pow(targetHelperDistance, 2) - Math.pow(helperY, 2))) / step) * step;
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

    private addResult(x: number, y: number, totalDistance: number, targetDistance: number, helperGearData: HelperGearData | null = null) {
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

            const helperGearCorrection = this.getGearRotationCorrection(this.gear1, helperGearData.gear, helperGearData.x, helperGearData.y)
            helperGearSVG.style.transform = 'rotate(' + helperGearCorrection + 'deg)';
            gearSVG2.style.transform = 'rotate(' + this.getGearRotationCorrection(helperGearData.gear, this.gear2, x - helperGearData.x, y - helperGearData.y, helperGearCorrection) + 'deg)';
        } else {
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
        } else {
            resultElement.appendChild(this.createResultText(helperGearData.x, helperGearData.y, this.gear1 == 140, helperGearData.distance, helperGearData.targetDistance));
            resultElement.appendChild(this.createResultText(x - helperGearData.x, y - helperGearData.y, this.gear2 == 140, totalDistance, targetDistance));
            

            const resultText = document.createElement('div');    
            const distancesSpan = document.createElement("span");
            distancesSpan.innerText = x + " ✕ " + y;            
            if (x % 1 == 0 && y % 1 == 0) {
                distancesSpan.classList.add("result-good");
            } else {
                distancesSpan.classList.add("result-ok");
            }
            resultText.appendChild(distancesSpan);
    
            const textSpan = document.createElement("span");
            textSpan.innerText =  " total using a " + helperGearData.gear + " teeth helper gear";
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

    getGearRotationCorrection(gear1: number, gear2: number, x: number, y: number, gear1Rotation = 0) {
        const angle = Math.atan2(y, x);
    
        let gear1ToothPosition = (angle / (2 * Math.PI) * gear1 - gear1Rotation * gear1 / 360) % 1;
        const gear2ToothPosition = ((angle + Math.PI) / (2 * Math.PI) * gear2) % 1;
    
        if (gear1 == 140 || gear2 == 140) {
            gear1ToothPosition = 1.0 - gear1ToothPosition;
        }
    
        const correction = (gear1ToothPosition + gear2ToothPosition + 0.5) % 1; // in teeth
        return correction / gear2 * 360;
    }

    createResultText(x: number, y: number, hasBananaGear: boolean, totalDistance: number, targetDistance: number) {
        const resultText = document.createElement('div');
        let error = totalDistance - targetDistance;

        if (hasBananaGear) {
            error *= -1;
        }

        const distancesSpan = document.createElement("span");
        distancesSpan.innerText = x + " ✕ " + y;            
        if (x % 1 == 0 && y % 1 == 0) {
            distancesSpan.classList.add("result-good");
        } else {
            distancesSpan.classList.add("result-ok");
        }
        resultText.appendChild(distancesSpan);

        const errorSpan = document.createElement("span");
        if (error == 0) {
            errorSpan.innerText =  " (exact fit)";
            errorSpan.classList.add("result-good");
        } else {
            errorSpan.innerText = ", distance: " + (Math.round(totalDistance * 100) / 100) + " / " + targetDistance + ", error: " + (Math.round(Math.abs(error) * 1000) / 1000) + " units (" + (Math.round(Math.abs(error) * 8 * 100) / 100) + "mm) " + (error < 0 ? "too close" : "too far");
        }
        resultText.appendChild(errorSpan);

        return resultText;
    }
}