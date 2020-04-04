
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
        const svgNamespace = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(svgNamespace, "svg");    
        var path = document.createElementNS(svgNamespace, "path");    
    
        path.setAttribute("d", this.pathStrings.join(' '));
    
        svg.appendChild(path);
        svg.setAttribute("height", this.radiusOuter * 5);
        svg.setAttribute("width", this.radiusOuter * 5);
        svg.setAttribute("viewBox", (-this.radiusOuter) + " " + (-this.radiusOuter) + " " + (2 * this.radiusOuter) + " " + (2 * this.radiusOuter));
        svg.setAttribute("class", "gear")
    
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

class Fraction {
    constructor(a, b=1, reduce=true) {
        this.a = a;
        this.b = b;

        while (this.a % 1 != 0 | this.b % 1 != 0) {
            this.a *= 10;
            this.b *= 10;
        }

        if (reduce) {
            var n = greatestCommonDenominator(a, b);
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

class Connection {
    constructor(gear1, gear2) {
        this.gear1 = gear1;
        this.gear2 = gear2;
        this.totalTeeth = gear1 + gear2;
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
        distanceDiv.innerText = (this.totalTeeth) / 16 + " units";
        distanceDiv.classList.add("distance");
        if (this.totalTeeth % 16 == 0) {
            distanceDiv.classList.add("dst-good");
        } else if (this.totalTeeth % 8 == 0) {
            distanceDiv.classList.add("dst-ok");
        } else {
            distanceDiv.classList.add("dst-bad");
        }
        distanceDiv.title = "Distance between axes";
        result.appendChild(distanceDiv);
    
        return result;
    }
}

const gears = [8, 16, 24, 40, 12, 20, 28, 36];

const connections = [
    new Connection(8, 16),
    new Connection(8, 24),
    new Connection(8, 40),
    new Connection(8, 56),
    new Connection(12, 20),
    new Connection(12, 28),
    new Connection(12, 36),
    new Connection(12, 60)
]

var ratio = new Fraction(1);
document.body.appendChild(ratio.createDiv());

for (var connection of connections) {
    document.body.appendChild(connection.createDiv());
    ratio = ratio.multiply(connection.fraction);
    document.body.appendChild(ratio.createDiv());
}