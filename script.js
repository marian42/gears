
function getOnCircle(angle, radius) {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

class GearSVG {
    constructor(n) {
        this.teeth = n;
        this.pathStrings = [];

        this.radiusPitch = n / 2;
        this.radiusInner = this.radiusPitch - 1.35;
        this.radiusOuter = this.radiusPitch + 0.85;
        this.radiusIntermediate = this.radiusInner + 0.9;

        this.createTeeth();
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
