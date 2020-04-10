const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const PIXELS_PER_MM = 2.5;

const STANDARD_GEARS = [1, 8, 16, 24, 40, 56, 12, 20, 28, 36, 60, 140];

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
    const ry = newStyle ? 4 : 7.9;
    const stepCount = newStyle ? 2.5 : 5;
    const yStep = ry * 2 / stepCount;

    var vertices = [];

    for (var i = 0; i < stepCount; i++) {
        vertices.push([-rxOuter, -ry + i * yStep]);
        vertices.push([-rxOuter, -ry + i * yStep + yStep * 0.25]);
        vertices.push([-rxInner, -ry + i * yStep + yStep * 0.5]);
        vertices.push([-rxInner, -ry + i * yStep + yStep * 0.75]);
    }
    if (newStyle) {
        vertices.pop();
    }
    vertices.push([-rxOuter, +ry]);

    for (var i = 0; i < stepCount; i++) {
        vertices.push([newStyle ? rxOuter : rxInner, ry - i * yStep]);
        vertices.push([+rxOuter, ry - i * yStep - yStep * 0.25]);
        vertices.push([newStyle ? rxInner : rxOuter, ry - i * yStep - yStep * 0.5]);
        vertices.push([+rxInner, ry - i * yStep - yStep * 0.75]);
    }
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
    svg.classList.add("gear");
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

    createDiv() {
        var result = document.createElement("div");
        result.setAttribute("class", "connection");
    
        var table = document.createElement("table");
        var row = document.createElement("tr");
    
        var cell = document.createElement("td");
        if (this.gear1 == 1) {
            cell.appendChild(createWormGearSVG(this.useNewStyleWormGear));
        } else {
            cell.appendChild(createGearSVG(this.gear1));
        }
        row.appendChild(cell);
    
        cell = document.createElement("td");
        if (this.gear2 == 1) {
            cell.appendChild(createWormGearSVG(this.useNewStyleWormGear));
        } else {
            cell.appendChild(createGearSVG(this.gear2));
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
    
        var distanceDiv = document.createElement("div");
        distanceDiv.innerText = this.distance + (this.distance == 1 ? " unit" : " units");
        distanceDiv.classList.add("distance");
        if (this.distance % 1 == 0) {
            distanceDiv.classList.add("dst-good");
        } else if (this.distance % 0.5 == 0) {
            distanceDiv.classList.add("dst-ok");
        } else {
            distanceDiv.classList.add("dst-bad");
        }
        distanceDiv.title = "Distance between axes";
        result.appendChild(distanceDiv);
    
        return result;
    }
}

function printFactors(number) {
    console.log(number + ": " + factorize(number).join(', '));
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
            maxOccurancesThisFactor = Math.floor(targetFactors[i] / factors[i]);
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

function createSequence(gearsPrimary, gearsSecondary) {
    var connections = [];    

    var binsPrimary = createBins(gearsPrimary, function (gear) { return gear % 16; });
    var binsSecondary = createBins(gearsSecondary, function (gear) { return (16 - gear % 16) % 16; });
    var remainderPrimary = [];
    var remainderSecondary = [];

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

    return connections;
}

function displayGearSequence(sequence, container) {
    var ratio = new Fraction(1);
    var div = document.createElement("div");
    div.classList.add("sequence");
    div.appendChild(ratio.createDiv());
    for (var connection of sequence) {
        div.appendChild(connection.createDiv());
        ratio = ratio.multiply(connection.fraction);
        div.appendChild(ratio.createDiv());
    }
    container.appendChild(div);
}

function getAvailableGears() {
    var result = [];

    if (document.getElementById('standardgearscheckbox').checked) {
        for (var gearString of document.getElementById('standardgearslist').value.split(',')) {
            gearString = gearString.trim();
            var teethCount = parseInt(gearString);
            if (!isNaN(teethCount) && !result.includes(teethCount)) {
                result.push(teethCount);
            }
        }
    }

    if (document.getElementById('customgearscheckbox').checked) {
        for (var gearString of document.getElementById('customgearslist').value.split(',')) {
            gearString = gearString.trim();
            var teethCount = parseInt(gearString);
            if (!isNaN(teethCount) && !result.includes(teethCount)) {
                result.push(teethCount);
            }
        }
    }

    return result;
}

if (typeof document !== 'undefined') { // This is not run in worker threads
    var resultDiv = document.getElementById("result");
    var searchingSpan = document.getElementById("searching");

    var currentWorker = null;

    var currentTaskId = 0;

    function onReceiveWorkerMessage(event) {
        if (event.data.type == 'solution' && event.data.id == currentTaskId) {
            var sequence = createSequence(event.data.gearsPrimary, event.data.gearsSecondary);
            displayGearSequence(sequence, resultDiv);
        }
        if (event.data.type == 'stop' && event.data.id == currentTaskId) {
            searchingSpan.style.display = 'none';
            currentWorker = null;
        }
    }
    
    document.getElementById('calculate').addEventListener('click', function(event) {
        event.preventDefault();
        
        var input = document.getElementById('ratio').value;
        var targetRatio = parseFraction(input);
        var distanceConstraint = null;
        if (document.getElementById('full').checked) {
            distanceConstraint = 1;
        } else if (document.getElementById('half').checked) {
            distanceConstraint = 0.5;
        }

        resultDiv.textContent = '';
        currentTaskId++;

        if (currentWorker != null) {
            currentWorker.terminate();
        }

        currentWorker = new Worker("script.js");

        currentWorker.onmessage = onReceiveWorkerMessage;

        currentWorker.postMessage({
            'type': 'start',
            'targetRatio': targetRatio,
            'gears': getAvailableGears(),
            'distanceConstraint': distanceConstraint,
            'id': currentTaskId
        });
        searchingSpan.style.display = "inline";
    });

    document.getElementById('stop').addEventListener('click', function(event) {
        event.preventDefault();

        if (currentWorker != null) {
            currentWorker.terminate();
            currentWorker = null;
        }

        searchingSpan.style.display = "none";
    });
}

onmessage = function(event) {
    if (event.data.type == "start") {
        event.data.targetRatio = new Fraction(event.data.targetRatio.a, event.data.targetRatio.b);
        findSolutions(event.data);
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
    return gearFactorsSet.values();
}

function findSolutions(parameters) {
    var gearFactors = {};
    for (var gear of parameters.gears) {
        gearFactors[gear] = factorize(gear);
    }    

    var hammingIterator = getHammingSequence(getGearFactorsSet(parameters.gears, gearFactors));
    var startTime = new Date().getTime();
    var solutionsFound = 0;
    while (true) {
        var currentRatio = parameters.targetRatio.extend(hammingIterator.next().value);

        var solutionsPrimary = findGears(currentRatio.a, parameters.gears, gearFactors);

        if (solutionsPrimary.length == 0) {
            continue;
        }
        for (var solutionPrimary of solutionsPrimary) {
            var solutionsSecondary = findGears(currentRatio.b, parameters.gears.filter(gear => !solutionPrimary.includes(gear)), gearFactors);
            for (var solutionSecondary of solutionsSecondary) {
                
                var violatesConstraint = false;
                if (parameters.distanceConstraint !== null) {
                    var sequence = createSequence(solutionPrimary, solutionSecondary);
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
                    solutionsFound++;
                }
                if (solutionsFound >= 500) {
                    postMessage({
                        'id': parameters.id,
                        'type': 'stop',
                        'reason': 'solutions'
                    });
                    close();
                    return;
                }
            }
        }

        if (new Date().getTime() - startTime > 60000) {
            postMessage({
                'id': parameters.id,
                'type': 'stop',
                'reason': 'time'
            });
            close();
            return;
        }        
    }
    return solutions;
}