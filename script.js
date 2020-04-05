
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

        if (n != 140 && n != 1) {
            this.createTeeth(n);
        } else {
            this.radiusOuter += 14;
        }

        var xExtension = 0;
        var yExtension = 0;
        var extensionSize = 0.5;

        var hasAxleHole = true;

        switch (n) {
            case 1:
                this.createWormGear();
                hasAxleHole = false;
                this.radiusOuter = 8;
                break;
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

    createWormGear() {
        const rxOuter = 4.9;
        const rxInner = 3;
        const ry = 7.9;
        const yStep = ry * 2 / 5;

        var vertices = [];

        for (var i = 0; i < 5; i++) {
            vertices.push([-rxOuter, -ry + i * yStep]);
            vertices.push([-rxOuter, -ry + i * yStep + yStep * 0.25]);
            vertices.push([-rxInner, -ry + i * yStep + yStep * 0.5]);
            vertices.push([-rxInner, -ry + i * yStep + yStep * 0.75]);
        }
        vertices.push([-rxOuter, +ry]);

        for (var i = 0; i < 5; i++) {
            vertices.push([+rxInner, ry - i * yStep]);
            vertices.push([+rxOuter, ry - i * yStep - yStep * 0.25]);
            vertices.push([+rxOuter, ry - i * yStep - yStep * 0.5]);
            vertices.push([+rxInner, ry - i * yStep - yStep * 0.75]);
        }
        vertices.push([+rxInner, -ry]);

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
        const svgNamespace = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(svgNamespace, "svg");    
        var path = document.createElementNS(svgNamespace, "path");    
    
        path.setAttribute("d", this.pathStrings.join(' '));
    
        svg.appendChild(path);
        svg.setAttribute("height", this.radiusOuter * 5);
        svg.setAttribute("width", this.radiusOuter * 5);
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
        this.distance = (gear1 + gear2 + (gear1 == 1 || gear2 == 1 ? 7 : 0)) / 16;
        this.fraction = new Fraction(gear1, gear2);
    }

    createDiv() {
        var result = document.createElement("div");
        result.setAttribute("class", "connection");
    
        var table = document.createElement("table");
        var row = document.createElement("tr");
    
        var cell = document.createElement("td");
        cell.appendChild(createGearSVG(this.gear1));
        row.appendChild(cell);
    
        cell = document.createElement("td");
        cell.appendChild(createGearSVG(this.gear2));
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
        distanceDiv.innerText = this.distance + " units";
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

var resultDiv = document.getElementById("result");

const STANDARD_GEARS = [1, 8, 16, 24, 40, 56, 12, 20, 28, 36, 60, 140];
const GEARS = [1, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 36, 40, 56, 60];

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

var gearFactors = {};
for (var gear of GEARS) {
    gearFactors[gear] = factorize(gear);
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

function findGears(target, excludedGears=[]) {
    const targetFactors = factorize(target);

    var gearTeeth = [];
    var gearMaxCounts = [];

    for (var gear of GEARS) {
        if (excludedGears.includes(gear)) {
            continue;
        }
        const factors = gearFactors[gear];
        if (factors.length > targetFactors) {
            continue;
        }
        var maxOccurances = null;
        for (var i = 1; i < factors.length; i++) {
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

function findSolutions(targetRatio) {
    var solutions = [];
    for (var extensionFactor = 1; extensionFactor < 1000; extensionFactor++) {
        var currentRatio = targetRatio.extend(extensionFactor);

        var solutionsPrimary = findGears(currentRatio.a);

        if (solutionsPrimary.length == 0) {
            continue;
        }
        for (var solutionPrimary of solutionsPrimary) {
            var solutionsSecondary = findGears(currentRatio.b, solutionPrimary);
            for (var solutionSecondary of solutionsSecondary) {
                var result = [];
                for (var i = 0; i < Math.max(solutionPrimary.length, solutionSecondary.length); i++) {
                    result.push(new Connection(i < solutionPrimary.length ? solutionPrimary[i] : 1, i < solutionSecondary.length ? solutionSecondary[i] : 1))
                }
                solutions.push(result);
            }
        }
    }
    return solutions;
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

document.getElementById('calculate').addEventListener('click', function(event) {
    event.preventDefault();
    
    var input = document.getElementById('ratio').value;
    var targetRatio = parseFraction(input);

    var solutions = findSolutions(targetRatio);

    if (solutions.length == 0) {
        resultDiv.textContent = "Nothing found."
    } else {
        resultDiv.textContent = '';
        for (var solution of solutions) {
            displayGearSequence(solution, resultDiv);
        }
    }
});