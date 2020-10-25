class Connection {
    public readonly gear1: number;
    public readonly gear2: number;

    private readonly useNewStyleWormGear: boolean = false;
    public readonly distance: number;

    public readonly fraction: Fraction;
    public readonly factor: number;

    public svg1: SVGSVGElement | null = null;
    public svg2: SVGSVGElement | null = null;

    constructor(gear1: number, gear2: number) {
        this.gear1 = gear1;
        this.gear2 = gear2;
        if (gear1 == 1 || gear2 == 1) {
            this.useNewStyleWormGear = (gear1 + gear2 + 11) % 8 == 0;
            this.distance = (gear1 + gear2 - 1 + (this.useNewStyleWormGear ? 12 : 8)) / 16;
        } else {
            this.distance = (gear1 + gear2) / 16;
        }

        this.fraction = new Fraction(gear1, gear2);
        this.factor = this.fraction.getDecimal();
    }

    public createDiv(animate=true, animationDuration=4, reverse=false) {
        var result = document.createElement("div");
        result.setAttribute("class", "connection");
    
        var table = document.createElement("table");
        var row = document.createElement("tr");
    
        var cell = document.createElement("td");
        if (this.gear1 == 1) {
            this.svg1 = GearSVGGenerator.createWormGearSVG(this.useNewStyleWormGear);
            cell.appendChild(this.svg1);
            if (!reverse) {
                (this.svg1!.firstChild as SVGElement).style.animationDirection = 'reverse';
            }
        } else {
            this.svg1 = GearSVGGenerator.createGearSVG(this.gear1);
            if (reverse) {
                (this.svg1!.firstChild as SVGElement).style.animationDirection = 'reverse';
            }
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
        if (!reverse) {
            (this.svg2.firstChild as SVGElement).style.animationDirection = 'reverse';
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
    
        var distanceDiv = document.createElement("div");
        var distanceSpan = document.createElement("span");
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
        if ((this.gear1 - 4) % 8 == 0 && (this.gear2 - 4) % 8 == 0) {
            var perpendicular = document.createElement("span");
            perpendicular.innerText = ' or perpendicular';
            perpendicular.title = 'The gears can be placed on perpendicular axles.';
            distanceDiv.appendChild(perpendicular);
        }

        if (this.gear1 != 1 && this.gear2 != 1) {
            var solutionCount = 0;
            var fullSolution = null;
            var halfSolution = null;

            var radius1 = this.gear1 / 16;
            var radius2 = this.gear2 / 16;

            if (this.gear1 == 140) {
                radius1 -= radius2 * 2;
            } else if (this.gear2 == 140) {
                radius2 -= radius1 * 2;
            }

            var targetDistance = radius1 + radius2;
            var maxError = DEFAULT_FIT_ERROR / 8;

            var step = 0.5;
            if (searchTab !== null && searchTab!.currentTask !== null) {
                searchTab!.currentTask!.distanceConstraint == 1 ? 1 : 0.5;
            }

            for (var y = 0; y <= Math.ceil(targetDistance); y += step) {
                var x = Math.round((Math.sqrt(Math.pow(targetDistance, 2) - Math.pow(y, 2))) / step) * step;
                if (y == 0 || Number.isNaN(x) || x < y) {
                    continue;
                }
    
                var totalDistance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                var error = totalDistance - targetDistance;
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
                var orSpan = document.createElement("span");
                orSpan.innerText = " or ";
                orSpan.classList.add("result-bad");
                distanceDiv.appendChild(orSpan);
                var fitSpan = document.createElement("span");
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
        this.updateAnimation(animate, animationDuration);
        return result;
    }

    public updateAnimation(enabled: boolean, duration: number) {
        (this.svg1!.firstChild as SVGElement).style.animationDuration = duration + "s";
        (this.svg1!.firstChild as SVGElement).style.animationPlayState = enabled ? 'running' : 'paused';
        
        (this.svg2!.firstChild as SVGElement).style.animationDuration = (duration / this.factor) + "s";
        (this.svg2!.firstChild as SVGElement).style.animationPlayState = enabled ? 'running' : 'paused';
    }

    private showFitGearsTab() {
        var includeHalfUnits = true;
        if (searchTab !== null && searchTab.currentTask !== null) {
            includeHalfUnits = searchTab!.currentTask!.distanceConstraint != 1;
        }
        fitGears.showConnection(this.gear1, this.gear2, includeHalfUnits);
    }
}