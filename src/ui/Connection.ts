function gearsFitPerpendicularly(gear1: number, gear2: number): boolean {
    return (gear1 - 4) % 8 == 0 && (gear2 - 4) % 8 == 0 && gear1 != 140 && gear2 != 140;
}

function getGearDistance(gear1: number, gear2: number): number {
    if (gear1 == 1 || gear2 == 1) {
        const useNewStyleWormGear = (gear1 + gear2 + 11) % 8 == 0;
        return (gear1 + gear2 - 1 + (useNewStyleWormGear ? 12 : 8)) / 16;
    } else if (gear1 == 140 || gear2 == 140) {
        return (Math.max(gear1, gear2) - Math.min(gear1, gear2)) / 16;
    } else {
        return (gear1 + gear2) / 16;
    }
}

class Connection {
    public readonly gear1: number;
    public readonly gear2: number;

    private readonly useNewStyleWormGear: boolean;
    public readonly distance: number;

    public readonly fraction: Fraction;
    public readonly factor: number;

    public svg1: SVGSVGElement | null = null;
    public svg2: SVGSVGElement | null = null;

    public rotationSpeed = 1;

    constructor(gear1: number, gear2: number) {
        this.gear1 = gear1;
        this.gear2 = gear2;
        this.useNewStyleWormGear = (gear1 + gear2 + 11) % 8 == 0;
        this.distance = getGearDistance(gear1, gear2);

        this.fraction = new Fraction(gear1, gear2);
        this.factor = this.fraction.getDecimal();
    }

    public createDiv() {
        const result = document.createElement("div");
        result.setAttribute("class", "connection");
    
        const table = document.createElement("table");
        let row = document.createElement("tr");
    
        let cell = document.createElement("td");
        if (this.gear1 == 1) {
            this.svg1 = GearSVGGenerator.createWormGearSVG(this.useNewStyleWormGear);
            cell.appendChild(this.svg1);
        } else {
            this.svg1 = GearSVGGenerator.createGearSVG(this.gear1);
            cell.appendChild(this.svg1);
        }
        row.appendChild(cell);
        
        cell = document.createElement("td");
        if (this.gear2 == 1) {
            this.svg2 = GearSVGGenerator.createWormGearSVG(this.useNewStyleWormGear);
            cell.appendChild(this.svg2);
        } else {
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
        } else if (this.distance % 0.5 == 0) {
            distanceSpan.classList.add("result-ok");
        } else {
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
            let fullSolution: [number, number] | null = null;
            let halfSolution: [number, number] | null = null;

            let radius1 = this.gear1 / 16;
            let radius2 = this.gear2 / 16;

            if (this.gear1 == 140) {
                radius1 -= radius2 * 2;
            } else if (this.gear2 == 140) {
                radius2 -= radius1 * 2;
            }

            const targetDistance = radius1 + radius2;
            const maxError = DEFAULT_FIT_ERROR / 8;

            const step = 0.5;
            if (searchTab !== null && searchTab!.currentTask !== null) {
                searchTab!.currentTask!.distanceConstraint == 1 ? 1 : 0.5;
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
                } else if (halfSolution != null && this.distance % 0.5 != 0) {
                    fitSpan.innerText = halfSolution[0] + " ✕ " + halfSolution[1];
                    solutionCount--;
                    fitSpan.classList.add("result-ok");
                } else if (solutionCount > 0) {
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

    public updateAnimation(rotationsPerSecond: number) {
        const enabled = rotationsPerSecond != 0;

        const svg1 = this.svg1!.firstChild as SVGElement;
        const svg2 = this.svg2!.firstChild as SVGElement;

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

    private showFitGearsTab() {
        let includeHalfUnits = true;
        if (searchTab !== null && searchTab.currentTask !== null) {
            includeHalfUnits = searchTab!.currentTask!.distanceConstraint != 1;
        }
        fitGears.showConnection(this.gear1, this.gear2, includeHalfUnits);
    }
}