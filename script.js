"use strict";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const PIXELS_PER_MM = 2.5;

const STANDARD_GEARS = [1, 8, 16, 24, 40, 56, 12, 20, 28, 36, 60, 140];

const DEFAULT_GEARS_STANDARD = '1,8,16,24,40,56,12,20,28,36,60,140';
const DEFAULT_GEARS_CUSTOM = '10,11,13,14,15,17,18,19,21,22,23,25,26,27,29,30,31,32';

function getOnCircle(angle, radius) {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

class GearSVGCreator {
    constructor(n) {
        this.teeth = n;
        this.pathStrings = [];

        this.radiusInner = n / 2 - 1.2;
        this.radiusOuter = n / 2 + 0.85;

        if (n != 140) {
            this.createTeeth(n);
        } else {
            this.radiusOuter += 14;
        }

        var xExtension = 0;
        var yExtension = 0;
        var extensionSize = 0.5;

        var hasAxleHole = true;

        switch (n) {
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
                break
            case 36:
                yExtension = 1.2;
                this.addCircle(-8, 0);
                this.addCircle(+8, 0);
                this.createAxleHole(0, 8, 0, 1.2);
                this.createAxleHole(0, -8, 0, 1.2);
                this.createCutout(12.5, this.radiusInner - 2)
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
                for (var x = -1; x < 2; x += 2) {
                    for (var y = -1; y < 2; y += 2) {
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
                this.createTeeth(n, true, true);
                break;
            default:
                if (n >= 18) {
                    this.createCutout(4.4, this.radiusInner - 2);
                }
        }
        if (hasAxleHole) {
            this.createAxleHole(0, 0, xExtension, yExtension, extensionSize);
        }
    }

    createTeeth(n, cut=false, invert=false) {
        var vertices = [];

        var radiusPitch = n / 2;
        var radiusInner = radiusPitch - 1.2 * (invert ? -1 : 1);
        var radiusOuter = radiusPitch + 0.85 * (invert ? -1 : 1);
        var radiusIntermediate = radiusInner + 0.9 * (invert ? -1 : 1);
    
        for (var i = 0; i < n; i++) {
            var fraction = 2 * Math.PI / n;
            var angle = i * fraction;
    
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

    addPolygon(vertices) {    
        this.pathStrings.push("M " + vertices[0][0] + " " + vertices[0][1]);
        for (var i = 1; i < vertices.length; i++) {
            const vertex = vertices[i];
            this.pathStrings.push("L " + vertex[0] + " " + vertex[1]);
        }
        this.pathStrings.push("Z");
    }

    addCircle(x, y, diameter=5) {
        const r = diameter / 2;
        this.pathStrings.push("M " + (x - r) + ", " + y);
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + diameter + ",0");
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + (-diameter) + ",0");
    }

    createCutout(radiusInner, radiusOuter, margin=0.8) {
        const inner = Math.sqrt(Math.pow(radiusInner, 2.0) - Math.pow(margin, 2.0));
        const outer = Math.sqrt(Math.pow(radiusOuter, 2.0) - Math.pow(margin, 2.0));

        this.pathStrings.push("M " + margin + ", " + outer);
        this.pathStrings.push("A " + radiusOuter + " " + radiusOuter + " 0 0 0 " + outer + ", " + margin);
        this.pathStrings.push("L " + inner + ", " + margin);
        this.pathStrings.push("A " + radiusInner + " " + radiusInner + " 0 0 1 " +  + margin + ", " + inner);
        this.pathStrings.push("Z");

        this.pathStrings.push("M " + -margin + ", " + -outer);
        this.pathStrings.push("A " + radiusOuter + " " + radiusOuter + " 0 0 0 " + -outer + ", " + -margin);
        this.pathStrings.push("L " + -inner + ", " + -margin);
        this.pathStrings.push("A " + radiusInner + " " + radiusInner + " 0 0 1 " +  + -margin + ", " + -inner);
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

    createAxleHole(x = 0, y = 0, xExtension=2, yExtension=0, extensionSize=0.5) {
        const a = 1.78 / 2;
        const b = 4.78 / 2;
        const c = extensionSize / 2;
        var vertices = [
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
        var svg = document.createElementNS(SVG_NAMESPACE, "svg");    
        var path = document.createElementNS(SVG_NAMESPACE, "path");    
    
        path.setAttribute("d", this.pathStrings.join(' '));
    
        svg.appendChild(path);
        svg.setAttribute("height", this.radiusOuter * 2 * PIXELS_PER_MM);
        svg.setAttribute("width", this.radiusOuter * 2 * PIXELS_PER_MM);
        svg.setAttribute("viewBox", (-this.radiusOuter) + " " + (-this.radiusOuter) + " " + (2 * this.radiusOuter) + " " + (2 * this.radiusOuter));
        svg.classList.add("gear");
        if (!STANDARD_GEARS.includes(this.teeth)) {
            svg.classList.add("custom");
        }
    
        return svg;
    }
}

const gearCache = {};

function createGearSVG(n) {
    if (!(n in gearCache)) {
        gearCache[n] = new GearSVGCreator(n);
    }
    return gearCache[n].createSVG();
}

function createWormGearSVG(newStyle=false) {
    const rxOuter = newStyle ? 7.4 : 4.9;
    const rxInner = 3;
    const ry = newStyle ? 4 : 8;
    const stepCount = newStyle ? 4.8 : 7;
    const yStep = 3.2;

    var vertices = [];

    var teethOffset = newStyle ? -0.34 : -0.125;
    for (var i = 0; i < stepCount; i++) {
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

    for (var i = 0; i < stepCount; i++) {
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

    var stringVertices = [];
    for (var vertex of vertices) {
        stringVertices.push(vertex[0] + "," + vertex[1]);
    }

    var svg = document.createElementNS(SVG_NAMESPACE, "svg");    
    var polygon = document.createElementNS(SVG_NAMESPACE, "polygon");    

    polygon.setAttribute("points", stringVertices.join(' '));

    svg.appendChild(polygon);
    svg.setAttribute("height", ry * 2 * PIXELS_PER_MM);
    svg.setAttribute("width", rxOuter * 2 * PIXELS_PER_MM);
    svg.setAttribute("viewBox", (-rxOuter) + " " + (-ry) + " " + (2 * rxOuter) + " " + (2 * ry));
    svg.classList.add("worm");
    return svg;
}

function greatestCommonDenominator(a, b) {
    if (b == 0) {
        return a;
    } else {
        return greatestCommonDenominator(b, a % b);
    }
}

function isApproximatelyInteger(number) {
    return Math.abs(number - Math.round(number)) < 1e-8;
}

class Fraction {
    constructor(a, b=1, reduce=true) {
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
            var n = greatestCommonDenominator(this.a, this.b);
            this.a /= n;
            this.b /= n;
        }
    }

    getDecimal(digits=null) {
        if (digits === null) {
            return this.a / this.b;
        } else {
            return Math.round(this.a / this.b * Math.pow(10, digits)) / Math.pow(10, digits);
        }
    }

    extend(factor) {
        return new Fraction(this.a * factor, this.b * factor, false);
    }

    multiply(fraction) {
        return new Fraction(this.a * fraction.a, this.b * fraction.b);
    }

    toString() {
        return this.a + " / " + this.b;
    }

    createDiv() {
        var result = document.createElement("div");
        result.classList.add("fraction");

        if (this.b == 1) {
            var integer = document.createElement("div");
            integer.classList.add("integer");
            integer.innerText = this.a;
            result.appendChild(integer);
        } else {
            var container = document.createElement("div");
            container.classList.add("fraction-container");
            
            var nominator = document.createElement("div");
            nominator.classList.add("nominator");
            nominator.innerText = this.a;
            container.appendChild(nominator);

            var denominator = document.createElement("div");
            denominator.classList.add("denominator");
            denominator.innerText = this.b;
            container.appendChild(denominator);

            result.appendChild(container);
        }

        var decimal = document.createElement("div");
        decimal.classList.add("decimal");
        decimal.innerText = this.getDecimal(5);
        result.appendChild(decimal);
        return result;
    }
}

function parseFraction(value) {
    if (value.includes('/')) {
        var parts = value.split('/');
        return new Fraction(Number.parseFloat(parts[0].trim()), Number.parseFloat(parts[1].trim()));
    } else {
        return new Fraction(Number.parseFloat(value.trim()));
    }
}

class Connection {
    constructor(gear1, gear2) {
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

    createDiv(animate=true, animationDuration=4, reverse=false) {
        var result = document.createElement("div");
        result.setAttribute("class", "connection");
    
        var table = document.createElement("table");
        var row = document.createElement("tr");
    
        var cell = document.createElement("td");
        if (this.gear1 == 1) {
            this.svg1 = createWormGearSVG(this.useNewStyleWormGear);
            cell.appendChild(this.svg1);
            if (!reverse) {
                this.svg1.firstChild.style.animationDirection = 'reverse';
            }
        } else {
            this.svg1 = createGearSVG(this.gear1);
            if (reverse) {
                this.svg1.firstChild.style.animationDirection = 'reverse';
            }
            cell.appendChild(this.svg1);
        }
        row.appendChild(cell);
        
        cell = document.createElement("td");
        if (this.gear2 == 1) {
            this.svg2 = createWormGearSVG(this.useNewStyleWormGear);
            cell.appendChild(this.svg2);
        } else {
            this.svg2 = createGearSVG(this.gear2);
            if (this.gear2 % 2 == 0) {
                this.svg2.style.transform = 'rotate(' + (180 / this.gear2) + 'deg)';
            }
            cell.appendChild(this.svg2);
        }
        if (!reverse) {
            this.svg2.firstChild.style.animationDirection = 'reverse';
        }
        row.appendChild(cell);
    
        table.appendChild(row);
    
        row = document.createElement("tr");
    
        cell = document.createElement("td");
        cell.setAttribute("class", "teeth");
        cell.innerText = this.gear1;
        row.appendChild(cell);
    
        cell = document.createElement("td");
        cell.innerText = this.gear2;
        cell.setAttribute("class", "teeth");
        row.appendChild(cell);
    
        table.appendChild(row);
        result.appendChild(table);
    
        var distanceSpan = document.createElement("span");
        distanceSpan.innerText = this.distance + (this.distance == 1 ? " unit" : " units");
        distanceSpan.classList.add("distance");
        if (this.distance % 1 == 0) {
            distanceSpan.classList.add("dst-good");
        } else if (this.distance % 0.5 == 0) {
            distanceSpan.classList.add("dst-ok");
        } else {
            distanceSpan.classList.add("dst-bad");
        }
        distanceSpan.title = "Distance between axes";
        result.appendChild(distanceSpan);
        if ((this.gear1 - 4) % 8 == 0 && (this.gear2 - 4) % 8 == 0) {
            var perpendicular = document.createElement("span");
            perpendicular.innerText = ' or perpendicular';
            perpendicular.title = 'The gears can be placed on perpendicular axles.';
            result.appendChild(perpendicular);
        
        }
        this.updateAnimation(animate, animationDuration);
        return result;
    }

    updateAnimation(enabled, duration) {
        this.svg1.firstChild.style.animationDuration = duration + "s";
        this.svg1.firstChild.style.animationPlayState = enabled ? 'running' : 'paused';
        
        this.svg2.firstChild.style.animationDuration = (duration / this.factor) + "s";
        this.svg2.firstChild.style.animationPlayState = enabled ? 'running' : 'paused';
    }
}

function factorize(number) {
    var result = [];
    for (var i = 2; i <= number; i++) {
        var value = 0;
        while (number % i == 0) {
            value += 1;
            number /= i;
        }
        result.push(value);
    }
    return result;
}

// Returns an iterator over all numbers that can be made with the given factors
function* getHammingSequence(bases) {
    var queues = {};
    for (var base of bases) {
        queues[base] = [];
    }
    var nextResult = 1;
    while (true) {
        yield nextResult;
 
        for (base in queues) {
            queues[base].push(nextResult * base)
        }

        var smallestNextQueueItem = null;

        for (base in queues) {
            if (smallestNextQueueItem == null || queues[base][0] < smallestNextQueueItem) {
                smallestNextQueueItem = queues[base][0];
            }
        }

        nextResult = smallestNextQueueItem;
 
        for (base in queues) {
            if (queues[base][0] == nextResult) {
                queues[base].shift();
            }
        }
    }
}

function getTeethProduct(gearTeeth, gearCounts) {
    var result = 1;
    for (var i = 0; i < gearTeeth.length; i++) {
        result *= Math.pow(gearTeeth[i], gearCounts[i]);
    }
    return result;
}

function getResult(gearTeeth, gearCounts) {
    var result = [];
    for (var i = 0; i < gearTeeth.length; i++) {
        for (var j = 0; j < gearCounts[i]; j++) {
            result.push(gearTeeth[i]);
        }
    }
    return result;
}

function findGears(target, availableGears, gearFactors) {
    const targetFactors = factorize(target);

    var gearTeeth = [];
    var gearMaxCounts = [];
    var availableFactors = new Set();

    for (var gear of availableGears) {
        const factors = gearFactors[gear];
        if (factors.length > targetFactors.length) {
            continue;
        }
        var maxOccurances = null;
        for (var i = 0; i < factors.length; i++) {
            if (factors[i] == 0) {
                continue;
            }
            var maxOccurancesThisFactor = Math.floor(targetFactors[i] / factors[i]);
            if (maxOccurances === null || maxOccurancesThisFactor < maxOccurances) {
                maxOccurances = maxOccurancesThisFactor;
            }
            if (maxOccurances == 0) {
                break;
            }
        }
        if (maxOccurances > 0) {
            gearTeeth.push(gear);
            gearMaxCounts.push(maxOccurances);
            for (var i = 0; i < factors.length; i++) {
                if (factors[i] != 0) {
                    availableFactors.add(i);
                }
            }
        }
    }

    for (var i = 0; i < targetFactors.length; i++) {
        if (targetFactors[i] != 0 && !availableFactors.has(i)) {
            // The target number contains prime factors that are not in any of the available gears.
            return [];
        }
    }

    var gearCounts = Array(gearTeeth.length).fill(0);
    var result = [];

    while (true) {
        var teethProduct = getTeethProduct(gearTeeth, gearCounts);
        if (teethProduct == target) {
            result.push(getResult(gearTeeth, gearCounts));
        }

        gearCounts[0] += 1;
        var position = 0;
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

function createBins(items, itemToBin) {
    var result = {};
    for (var item of items) {
        var bin = itemToBin(item);
        if (!(bin in result)) {
            result[bin] = [];
        }
        result[bin].push(item);
    }
    return result;
}

function getIndexOfBestMatch(gear, sequence) {
    for (var i = 0; i < sequence.length; i++) {
        if ((gear + sequence[i]) % 16 == 0) {
            return i;
        }
    }
    for (var i = 0; i < sequence.length; i++) {
        if ((gear + sequence[i]) % 8 == 0) {
            return i;
        }
    }
    for (var i = 0; i < sequence.length; i++) {
        if (sequence[i] % 8 != 0 && (sequence[i] + 12) % 8 != 0) {
            return i;
        }
    }
    return 0;
}

function createSequence(gearsPrimary, gearsSecondary, parameters) {
    var sequenceStart = [];
    for (var i = 0; i < parameters.startSequence.length - 1; i += 2) {
        sequenceStart.push(new Connection(parameters.startSequence[i], parameters.startSequence[i + 1]));
    }
    if (parameters.startSequence.length % 2 == 1) {
        var lastStartSequenceGear = parameters.startSequence[parameters.startSequence.length - 1];
        if (gearsSecondary.length == 0) {
            sequenceStart.push(new Connection(lastStartSequenceGear, 1));
        } else {
            var index = getIndexOfBestMatch(lastStartSequenceGear, gearsSecondary);
            sequenceStart.push(new Connection(lastStartSequenceGear, gearsSecondary[index]));
            gearsSecondary = gearsSecondary.slice();
            gearsSecondary.splice(index, 1);
        }
    }
    var sequenceEnd = [];
    if (parameters.endSequence.length % 2 == 1) {
        var firstEndSequenceGear = parameters.endSequence[0];
        if (gearsPrimary.length == 0) {
            sequenceStart.push(new Connection(1, firstEndSequenceGear));
        } else {
            var index = getIndexOfBestMatch(firstEndSequenceGear, gearsPrimary);
            sequenceEnd.push(new Connection(gearsPrimary[index], firstEndSequenceGear));
            gearsPrimary = gearsPrimary.slice();
            gearsPrimary.splice(index, 1);
        }
    }
    for (var i = parameters.endSequence.length % 2; i < parameters.endSequence.length; i += 2) {
        sequenceEnd.push(new Connection(parameters.endSequence[i], parameters.endSequence[i + 1]));
    }

    var binsPrimary = createBins(gearsPrimary, function (gear) { return gear % 16; });
    var binsSecondary = createBins(gearsSecondary, function (gear) { return (16 - gear % 16) % 16; });
    var remainderPrimary = [];
    var remainderSecondary = [];
    var connections = [];

    for (var i = 0; i < 16; i++) {
        if (!(i in binsPrimary) && !(i in binsSecondary)) {
            continue;
        }
        if (!(i in binsPrimary)) {
            remainderSecondary = remainderSecondary.concat(binsSecondary[i]);
        } else if (!(i in binsSecondary)) {
            remainderPrimary = remainderPrimary.concat(binsPrimary[i]);
        } else {
            const n = Math.min(binsPrimary[i].length, binsSecondary[i].length);
            for (var j = 0; j < n; j++) {
                connections.push(new Connection(binsPrimary[i][j], binsSecondary[i][j]));
            }
            remainderPrimary = remainderPrimary.concat(binsPrimary[i].slice(n));
            remainderSecondary = remainderSecondary.concat(binsSecondary[i].slice(n));
        }
    }

    var binsPrimary = createBins(remainderPrimary, function (gear) { return gear % 8; });
    var binsSecondary = createBins(remainderSecondary, function (gear) { return (8 - gear % 8) % 8; });
    var remainderPrimary = [];
    var remainderSecondary = [];

    for (var i = 0; i < 8; i++) {
        if (!(i in binsPrimary) && !(i in binsSecondary)) {
            continue;
        }
        if (!(i in binsPrimary)) {
            remainderSecondary = remainderSecondary.concat(binsSecondary[i]);
        } else if (!(i in binsSecondary)) {
            remainderPrimary = remainderPrimary.concat(binsPrimary[i]);
        } else {
            const n = Math.min(binsPrimary[i].length, binsSecondary[i].length);
            for (var j = 0; j < n; j++) {
                connections.push(new Connection(binsPrimary[i][j], binsSecondary[i][j]));
            }
            remainderPrimary = remainderPrimary.concat(binsPrimary[i].slice(n));
            remainderSecondary = remainderSecondary.concat(binsSecondary[i].slice(n));
        }
    }

    for (var i = 0; i < Math.max(remainderPrimary.length, remainderSecondary.length); i++) {
        connections.push(new Connection(i < remainderPrimary.length ? remainderPrimary[i] : 1, i < remainderSecondary.length ? remainderSecondary[i] : 1))
    }

    connections.sort(function (a, b) { return Math.sign(a.factor - b.factor); });

    return sequenceStart.concat(connections, sequenceEnd);
}

class Solution {
    constructor(sequence) {
        this.connections = sequence;
        var currentFraction = new Fraction(1);
        this.fractions = [currentFraction];
        for (var connection of this.connections) {
            currentFraction = currentFraction.multiply(connection.fraction);
            this.fractions.push(currentFraction);
        }
        this.ratio = currentFraction;
        if (!currentTask.exact) {
            this.error = Math.abs(this.ratio.getDecimal() / currentTask.targetRatio.getDecimal() - 1);
        }
    }

    createDiv() {
        var div = document.createElement("div");
        div.classList.add("sequence");
        div.appendChild(this.fractions[0].createDiv());

        for (var i = 0; i < this.connections.length; i++) {
            div.appendChild(this.connections[i].createDiv(animationSettings.enabled, animationSettings.duration / this.fractions[i].getDecimal(), i % 2 == 1));
            div.appendChild(this.fractions[i + 1].createDiv());

            if (i * 2 < currentTask.startSequence.length) {
                this.connections[i].svg1.classList.add("fixed");
            }
            if (i * 2 + 1 < currentTask.startSequence.length) {
                this.connections[i].svg2.classList.add("fixed");
            }
            if (i * 2 >= this.connections.length * 2 - currentTask.endSequence.length) {
                this.connections[i].svg1.classList.add("fixed");
            }
            if (i * 2 + 1 >= this.connections.length * 2 - currentTask.endSequence.length) {
                this.connections[i].svg2.classList.add("fixed");
            }
        }

        var infoDiv = document.createElement("div");
        infoDiv.classList.add("info");
        div.appendChild(infoDiv);
        if (!currentTask.exact) {
            var errorSpan = document.createElement('span');
            errorSpan.innerText = 'Error: ' + this.error.toPrecision(3) + ' ';
            infoDiv.appendChild(errorSpan);
        }
        var permalink = document.createElement('a');
        permalink.innerText = 'Permalink';
        permalink.title = 'Permanent link to this solution';
        permalink.href = this.getPermalink();
        infoDiv.appendChild(permalink);
        this.domObject = div;
        return div;
    }

    updateAnimation() {
        for (var i = 0; i < this.connections.length; i++) {
            this.connections[i].updateAnimation(animationSettings.enabled, animationSettings.duration / this.fractions[i].getDecimal());
        }
    }

    getPermalink() {
        var gears = [];
        for (var connection of this.connections) {
            gears.push(connection.gear1);
            gears.push(connection.gear2);
        }
        return '?seq=' + gears.join(',');
    }
}

class SolutionList {
    constructor(container) {
        this.container = container;
        this.container.textContent = '';
        this.solutions = {};
        this.sizeContainers = {};
        this.totalSolutions = 0;
        this.smallestError = null;
    }

    add(solution) {
        var count = solution.connections.length;
        if (!(count in this.solutions)) {
            var sizeContainer = document.createElement('div');
            var headline = document.createElement('h2');
            headline.innerText = 'Solutions with ' + count + (count > 1 ? ' connections' : ' connection');
            headline.name = count;
            sizeContainer.appendChild(headline);

            var done = false;
            for (var i = count -1; i > 0; i--) {
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

        if (currentTask.exact) {
            this.sizeContainers[count].appendChild(solution.createDiv());
            this.solutions[count].push(solution);
        } else {
            var inserted = false;
            for (var i = 0; i < this.solutions[count].length; i++) {
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
        document.getElementById('resultcount').innerText = this.totalSolutions;
        if (!currentTask.exact &&(this.smallestError == null || solution.error < this.smallestError)) {
            this.smallestError = solution.error;
            document.getElementById('smallest-error').innerText = this.smallestError.toPrecision(3);
        }
    }

    updateAnimation() {
        for (var count in this.solutions) {
            for (var solution of this.solutions[count]) {
                solution.updateAnimation();
            }
        }
    }
}

function parseGearList(value, distinct=false) {
    var result = [];
    for (var gearString of value.split(',')) {
        gearString = gearString.trim();
        var teethCount = parseInt(gearString);
        if (!isNaN(teethCount) && (!distinct || !result.includes(teethCount))) {
            result.push(teethCount);
        }
    }
    return result;
}

function getAvailableGears() {
    var result = [];

    if (document.getElementById('standardgearscheckbox').checked) {
        result = result.concat(parseGearList(document.getElementById('standardgearslist').value, true));
    }

    if (document.getElementById('customgearscheckbox').checked) {
        result = result.concat(parseGearList(document.getElementById('customgearslist').value, true));
    }

    return result;
}



class SequenceEditor {
    constructor(element) {
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

        this.gearSelector = document.createElement('div');
        this.gearSelector.classList.add('gear-selector');
        this.gearSelector.setAttribute('tabindex', 0);
        this.gearSelector.style.display = 'none';
        this.gearInput = document.createElement('input');
        this.gearInput.type = 'text';
        this.gearInput.placeholder = 'number of teeth';
        this.gearSelector.appendChild(this.gearInput);
        this.addButtonContainer.appendChild(this.gearSelector);
        this.gearPreviewContainer = document.createElement('div');
        this.gearPreviewContainer.classList.add('catalog-gear');
        this.gearPreviewContainer.style.display = 'none';
        this.gearSelector.appendChild(this.gearPreviewContainer);
        this.gearCatalog = document.createElement('div');
        this.gearCatalog.classList.add('catalog');
        this.gearSelector.appendChild(this.gearCatalog);
        
        this.permalink = document.getElementById('editor-permalink');
        this.animateCheckbox = document.getElementById('editor-animate');
        this.animateRpmInput = document.getElementById('editor-animate-rpm');

        this.clear();
        this.updateAnimation();

        this.prepareGearCatalog();

        var sequenceEditor = this
        this.addButton.addEventListener('click', function(event) {
            sequenceEditor.gearSelector.style.display = 'block';
            sequenceEditor.gearInput.value = '';
            sequenceEditor.gearInput.focus();
            sequenceEditor.gearPreviewContainer.style.display = 'none';
            sequenceEditor.gearCatalog.style.display = 'block';
        });

        this.gearSelector.addEventListener('focusout', function(event) {
            setTimeout(function() {
                var comaprePosition = sequenceEditor.gearSelector.compareDocumentPosition(document.activeElement);
                if (comaprePosition != 0 && comaprePosition != 20) {
                    sequenceEditor.gearSelector.style.display = 'none';
                }
            }, 0);
        });

        this.gearInput.addEventListener('keyup', function(event) {
            var gear = parseFloat(sequenceEditor.gearInput.value);
            var showPreview = Number.isInteger(gear) && (gear == 1 || gear >= 8);

            sequenceEditor.gearPreviewContainer.style.display = showPreview ? 'block' : 'none';
            sequenceEditor.gearCatalog.style.display =  showPreview ? 'none' : 'block';

            if (showPreview) {
                sequenceEditor.gearPreviewContainer.innerText = '';
                if (gear == 1) {
                    sequenceEditor.gearPreviewContainer.appendChild(createWormGearSVG());
                } else if (gear > 7 && gear <= 170) {
                    sequenceEditor.gearPreviewContainer.appendChild(createGearSVG(gear));
                }
            }
        });

        this.gearInput.addEventListener('keydown', function(event) {
            sequenceEditor.gearPreviewContainer.innerText = '';
            var gear = parseFloat(sequenceEditor.gearInput.value);
            if (event.keyCode == 13 && Number.isInteger(gear) && (gear == 1 || gear >= 8)) {
                sequenceEditor.addGear(gear);
                sequenceEditor.addButton.focus();
                event.preventDefault();
            }
        });

        this.gearPreviewContainer.addEventListener('click', function(event) {
            var gear = parseFloat(sequenceEditor.gearInput.value);
            if (Number.isInteger(gear) && (gear == 1 || gear >= 8)) {
                sequenceEditor.addGear(gear);
            }
        });

        this.animateCheckbox.addEventListener('change', function() { sequenceEditor.updateAnimation(); });
        this.animateRpmInput.addEventListener('change', function() { sequenceEditor.updateAnimation(); });
        this.animateRpmInput.addEventListener('keyup', function() { sequenceEditor.updateAnimation(); });
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
        this.gearSelector.style.display = 'none';

        if (this.danglingGear == null) {
            this.danglingGear = gear;
            var div = new Connection(gear, 1).createDiv(this.animationEnabled, this.animationDuration / this.resultFraction.getDecimal(), this.connections.length % 2 == 1);
            div.classList.add('hide-second');
            
            if (this.connections.length >= 1) {
                this.connectionContainer.appendChild(this.resultFraction.createDiv());
            }            
            this.connectionContainer.appendChild(div);
        } else {
            var connection = new Connection(this.danglingGear, gear);
            this.danglingGear = null;

            this.connectionContainer.removeChild(this.connectionContainer.lastChild);
            this.connectionContainer.appendChild(connection.createDiv(this.animationEnabled, this.animationDuration / this.resultFraction.getDecimal(), this.connections.length % 2 == 1));

            this.connections.push(connection);
            this.resultFraction = this.resultFraction.multiply(connection.fraction);
            this.updateDom();
        }

        this.updatePermalink();
    }

    getGears() {
        var gears = [];
        for (var connection of this.connections) {
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

    prepareGearCatalog() {
        var sequenceEditor = this;
        for (const gear of [1, 8, 16, 24, 40, 12, 20, 28, 36, 56, 60]) {
            var span = document.createElement('span');
            span.classList.add('catalog-gear');
            if (gear == 1) {
                span.appendChild(createWormGearSVG());
            } else {
                span.appendChild(createGearSVG(gear));
            }
            var teethDiv = document.createElement('div');
            teethDiv.classList.add('teeth');
            teethDiv.innerText = gear;
            span.appendChild(teethDiv);
            
            span.addEventListener('click', function (event) {
                sequenceEditor.addGear(gear);
            });

            this.gearCatalog.appendChild(span);
        }
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
        for (var gear of gears) {
            this.addGear(gear);
        }
    }

    updateAnimation() {
        var fraction = this.startFraction;
        this.animationEnabled = this.animateCheckbox.checked;
        this.animationDuration = 60 / parseFloat(this.animateRpmInput.value);
        for (var connection of this.connections) {
            connection.updateAnimation(this.animationEnabled, this.animationDuration / fraction.getDecimal());
            fraction = fraction.multiply(connection.fraction);
        }
    }

    reverse() {
        this.setSequence(this.getGears().reverse());
    }
}

if (typeof document !== 'undefined') { // This is not run in worker threads
    var resultDiv = document.getElementById("result");
    var searchingSpan = document.getElementById("searching");

    var currentWorker = null;

    var currentTaskId = 0;
    var currentTask = null;

    var animationSettings = {};

    function onReceiveWorkerMessage(event) {
        if (event.data.type == 'solution' && event.data.id == currentTaskId) {
            var sequence = createSequence(event.data.gearsPrimary, event.data.gearsSecondary, currentTask);
            currentTask.solutionList.add(new Solution(sequence));

            if (currentTask.solutionList.totalSolutions >= currentTask.maxNumberOfResults) {
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

    function readFixedSequenceGears(currentTask) {
        currentTask.startSequence = parseGearList(document.getElementById('fixedStart').value);
        currentTask.endSequence = parseGearList(document.getElementById('fixedEnd').value);

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
        }, parseInt(document.getElementById('limitTime').value) * 1000);
    }

    function startSearch() {
        var targetRatio = parseFraction(document.getElementById('ratio').value);
        var distanceConstraint = null;
        if (document.getElementById('full').checked) {
            distanceConstraint = 1;
        } else if (document.getElementById('half').checked) {
            distanceConstraint = 0.5;
        }
        var approxiamte = document.getElementById('approximate').checked;
        var error = parseFloat(document.getElementById('error').value);

        currentTaskId++;

        if (currentWorker != null) {
            currentWorker.terminate();
        }

        currentWorker = new Worker("script.js");

        currentWorker.onmessage = onReceiveWorkerMessage;

        currentTask = {
            'exact': !approxiamte,
            'error': error,
            'targetRatio': targetRatio,
            'gears': getAvailableGears(),
            'distanceConstraint': distanceConstraint,
            'id': currentTaskId,
            'maxNumberOfResults': parseInt(document.getElementById('limitCount').value)
        };

        readFixedSequenceGears(currentTask);

        currentWorker.postMessage(currentTask);
        searchingSpan.style.display = "inline";
        currentTask.solutionList = new SolutionList(resultDiv);
        handleTaskTimeout();

        document.getElementById('resultcount').innerText = 0;
        document.getElementById('result-meta').style.display = 'block';
        document.getElementById('smallest-error-container').style.display = currentTask.exact ? 'none' : 'inline';
        document.getElementById('smallest-error').innerText = '';
    }

    function stopSearch() {
        if (currentWorker != null) {
            currentWorker.terminate();
            currentWorker = null;
        }

        searchingSpan.style.display = "none";
    }
    
    document.getElementById('calculate').addEventListener('click', function(event) {
        event.preventDefault();
        
        startSearch();

        window.history.pushState({}, "", getUrlParameters());
    });

    document.getElementById('stop').addEventListener('click', function(event) {
        event.preventDefault();
        stopSearch();        
    });

    var sequenceEditor = new SequenceEditor(document.getElementById('sequence-editor'));
    document.getElementById('clear-sequence').addEventListener('click', function(event) {
        sequenceEditor.clear();
    });
    document.getElementById('reverse').addEventListener('click', function(event) {
        sequenceEditor.reverse();
    })

    function getUrlParameters() {
        var form = document.querySelector('form');
        var elements = {};
    
        var items = [];
        
        for (var element of form.elements) {
            elements[element.name] = element;
            if (element.type == 'radio' && element.checked) {
                items.push('dst=' + element.value);
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

        if (elements['limitCount'].value != '30') {
            items.push('count=' + encodeURI(elements['limitCount'].value));
        }

        if (elements['limitTime'].value != '30') {
            items.push('time=' + encodeURI(elements['limitTime'].value));
        }
    
        return '?' + items.join('&');
    }
    
    function loadUrlParameters(runSearch=true) {
        var parameters = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            parameters[key] = decodeURI(value);
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
                document.getElementById('tab-edit').checked = true;
                return;
            }
        }
    
        if ("targetratio" in parameters) {
            document.getElementById('tab-search').checked = true;
            var form = document.querySelector('form');
            var elements = {};
            
            for (var element of form.elements) {
                elements[element.name] = element;
            }
            
            elements['ratio'].value = parameters['targetratio'];
    
            if ('dst' in parameters) {
                document.getElementById(parameters['dst']).checked = true;
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
                document.getElementById("advanced-options").open = true;
            }
    
            if (runSearch) {
                startSearch();
            } else {
                resultDiv.innerText = '';
            }
        }
    }

    function updateAnimation() {
        animationSettings.enabled = document.getElementById('animate').checked;
        animationSettings.duration = 60 / parseFloat(document.getElementById('animate-rpm').value);

        if (currentTask != null) {
            currentTask.solutionList.updateAnimation();
        }
    }

    updateAnimation();

    document.getElementById('animate').addEventListener('change', updateAnimation);
    document.getElementById('animate-rpm').addEventListener('change', updateAnimation);
    
    loadUrlParameters();

    window.onpopstate = function(event) {
        loadUrlParameters(false);
        stopSearch();
    }
}

function getGearFactorsSet(gears, gearFactors) {
    var gearFactorsSet = new Set();
    for (var gear of gears) {
        for (var i = 0; i < gearFactors[gear].length; i++) {
            if (gearFactors[gear][i] > 0) {
                gearFactorsSet.add(i + 2);
            }
        }
    }
    return Array.from(gearFactorsSet.values());
}

function getMissingPrimeFactors(targetRatio, availableFactors) {
    var result = [];
    var numeratorFactors = factorize(targetRatio.a);
    for (var i = 0; i < numeratorFactors.length; i++) {
        if (numeratorFactors[i] > 0 && !availableFactors.includes(i + 2)) {
            result.push(i + 2);
        }
    }
    var denominatorFactors = factorize(targetRatio.b);
    for (var i = 0; i < denominatorFactors.length; i++) {
        if (denominatorFactors[i] > 0 && !availableFactors.includes(i + 2)) {
            result.push(i + 2);
        }
    }
    return result;
}

function* findSolutionsExact(parameters) {    
    var availableFactors = getGearFactorsSet(parameters.gears, parameters.gearFactors);

    var availableGearsPrimary = parameters.gears.filter(gear => !parameters.fixedSecondary.includes(gear));
    var availableGearsSecondary = parameters.gears.filter(gear => !parameters.fixedPrimary.includes(gear));

    var missingFactors = getMissingPrimeFactors(parameters.searchRatio, availableFactors);
    if (missingFactors.length != 0) {
        postMessage({
            'id': parameters.id,
            'type': 'stop',
            'reason': 'missingfactors',
            'missingFactors': missingFactors
        });
        close();
        return;
    }

    var hammingIterator = getHammingSequence(availableFactors);
    while (true) {
        var currentRatio = parameters.searchRatio.extend(hammingIterator.next().value);

        var solutionsPrimary = findGears(currentRatio.a, availableGearsPrimary, parameters.gearFactors);

        if (solutionsPrimary.length == 0) {
            continue;
        }
        for (var solutionPrimary of solutionsPrimary) {
            var solutionsSecondary = findGears(currentRatio.b, availableGearsSecondary.filter(gear => !solutionPrimary.includes(gear)), parameters.gearFactors);
            for (var solutionSecondary of solutionsSecondary) {
                yield [solutionPrimary, solutionSecondary];
            }
        }
    }
}

function* findSolutionsApproximate(parameters) {
    var targetRatio = parameters.searchRatio.getDecimal();
    
    var availableGearsPrimary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedSecondary.includes(gear));
    var availableGearsSecondary = parameters.gears.filter(gear => gear != 1 && !parameters.fixedPrimary.includes(gear));
    
    var hammingIterator = getHammingSequence(availableGearsPrimary);
    while (true) {
        var primaryValue = hammingIterator.next().value;
        var solutionsPrimary = findGears(primaryValue, availableGearsPrimary, parameters.gearFactors);

        if (solutionsPrimary.length == 0) {
            continue;
        }

        var denominatorMin = Math.ceil(primaryValue / targetRatio * (1.0 - parameters.error));
        var denominatorMax = Math.floor(primaryValue / targetRatio * (1.0 + parameters.error));
        
        if (denominatorMin > denominatorMax) {
            continue;
        }
        
        for (var solutionPrimary of solutionsPrimary) {
            var remainingGears = availableGearsSecondary.filter(gear => !solutionPrimary.includes(gear));

            for (var secondaryValue = denominatorMin; secondaryValue <= denominatorMax; secondaryValue++) {
                var solutionsSecondary = findGears(secondaryValue, remainingGears, parameters.gearFactors);
                for (var solutionSecondary of solutionsSecondary) {
                    yield [solutionPrimary, solutionSecondary];
                }
            }
        }
    }
}

onmessage = function(event) {
    var parameters = event.data;
    parameters.targetRatio = new Fraction(parameters.targetRatio.a, parameters.targetRatio.b);
    parameters.searchRatio = new Fraction(parameters.searchRatio.a, parameters.searchRatio.b);

    parameters.gearFactors = {};
    for (var gear of parameters.gears) {
        parameters.gearFactors[gear] = factorize(gear);
    }
    var wormGearAvailable = parameters.gears.includes(1);

    var iterator = parameters.exact ? findSolutionsExact(parameters) : findSolutionsApproximate(parameters);

    while (true) {
        var candidate = iterator.next().value;

        var solutionPrimary = candidate[0];
        var solutionSecondary = candidate[1];

        if (!wormGearAvailable && solutionPrimary.length + parameters.fixedPrimary.length != solutionSecondary.length + parameters.fixedSecondary.length) {
            continue;
        }

        var violatesConstraint = false;
        if (parameters.distanceConstraint !== null) {
            var sequence = createSequence(solutionPrimary, solutionSecondary, parameters);
            for (var connection of sequence) {
                if (connection.distance % parameters.distanceConstraint != 0) {
                    violatesConstraint = true;
                    break;
                }
            }
        }

        if (!violatesConstraint) {
            postMessage({
                'id': parameters.id,
                'type': 'solution',
                'gearsPrimary': solutionPrimary,
                'gearsSecondary': solutionSecondary
            });
        }
    }
}