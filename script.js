
function getOnCircle(angle, radius) {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

class GearSVG {
    constructor(n) {
        this.teeth = n;
        this.pathStrings = [];

        this.radiusPitch = n / 2;
        this.radiusInner = this.radiusPitch - 1.2;
        this.radiusOuter = this.radiusPitch + 0.85;
        this.radiusIntermediate = this.radiusInner + 0.9;

        this.createTeeth();

        var xExtension = 0;
        var yExtension = 0;
        var extensionSize = 0.5;

        switch (n) {
            case 20:
                xExtension = 1.6;
                yExtension = 1.6;
                break;
            case 36:
                yExtension = 1.2;
                this.addCircle(-8, 0);
                this.addCircle(+8, 0);
                this.createAxleHole(0, 8, 0, 1.2);
                this.createAxleHole(0, -8, 0, 1.2);
                break;
            case 16:
                this.addCircle(0, -4, 3.4);
                this.addCircle(0, +4, 3.4);
                this.addCircle(-4, 0, 3.4);
                this.addCircle(+4, 0, 3.4);
                break;
            case 24:
                yExtension = 3.8;
                extensionSize = 1.6
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
        }
        this.createAxleHole(0, 0, xExtension, yExtension, extensionSize);
    }

    createTeeth() {
        var vertices = [];
    
        for (var i = 0; i < n; i++) {
            var fraction = 2 * Math.PI / n;
            var angle = i * fraction;
    
            vertices.push(getOnCircle(angle - fraction * 0.29, this.radiusInner));
            vertices.push(getOnCircle(angle - fraction * 0.25, this.radiusIntermediate));
            vertices.push(getOnCircle(angle - fraction * 0.11, this.radiusOuter));
            vertices.push(getOnCircle(angle + fraction * 0.11, this.radiusOuter));
            vertices.push(getOnCircle(angle + fraction * 0.25, this.radiusIntermediate));
            vertices.push(getOnCircle(angle + fraction * 0.29, this.radiusInner));
        }

        this.addPolygon(vertices);
    }

    addPolygon(vertices) {    
        this.pathStrings.push("M " + vertices[vertices.length - 1][0] + " " + vertices[vertices.length - 1][1]);
        for (var vertex of vertices) {
            this.pathStrings.push("L " + vertex[0] + " " + vertex[1]);
        }
    }

    addCircle(x, y, diameter=5) {
        const r = diameter / 2;
        this.pathStrings.push("M " + (x - r) + ", " + y);
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + diameter + ",0");
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + (-diameter) + ",0");
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

        console.log(vertices.reverse());
        this.addPolygon(vertices.reverse());
    }

    getSVG() {
        const svgNamespace = "http://www.w3.org/2000/svg";
        var svg = document.createElementNS(svgNamespace, "svg");    
        var path = document.createElementNS(svgNamespace, "path");    
    
        path.setAttribute("d", this.pathStrings.join(' '));
    
        svg.appendChild(path);
        svg.setAttribute("height", this.radiusOuter * 8);
        svg.setAttribute("width", this.radiusOuter * 8);
        svg.setAttribute("viewBox", (-this.radiusOuter) + " " + (-this.radiusOuter) + " " + (2 * this.radiusOuter) + " " + (2 * this.radiusOuter));
        svg.setAttribute("class", "gear")
    
        return svg;
    }
}

function createGear(n) {
    return new GearSVG(n).getSVG();
}

const gears = [8, 16, 24, 40, 12, 20, 36];

for (var n of gears) {
    document.body.appendChild(createGear(n));
}

document.body.appendChild(document.createElement("br"));

for (var n = 10; n < 32; n++) {
    document.body.appendChild(createGear(n));
}
