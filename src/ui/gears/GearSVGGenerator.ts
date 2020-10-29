class GearSVGGenerator {
    public readonly teeth: number;
    
    private readonly radiusInner: number;
    private readonly radiusOuter: number;

    private pathStrings: string[] = [];

    private static gearCache: { [teeth: number] : GearSVGGenerator; } = {};

    constructor(n: number) {
        this.teeth = n;

        this.radiusInner = n / 2 - 1.2;
        this.radiusOuter = n / 2 + 0.85;

        if (n == 140) {
            this.radiusOuter += 14;
        } else {
            this.createTeeth(n);
        }

        this.createDecoration();
    }

    public static createGearSVG(n: number): SVGSVGElement {
        if (!(n in this.gearCache)) {
            this.gearCache[n] = new GearSVGGenerator(n);
        }
        return this.gearCache[n].createSVG();
    }

    createDecoration() {
        let xExtension = 0;
        let yExtension = 0;
        let extensionSize = 0.5;

        let hasAxleHole = true;

        switch (this.teeth) {
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
                for (let x = -1; x < 2; x += 2) {
                    for (let y = -1; y < 2; y += 2) {
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
                this.createTeeth(this.teeth, true, true);
                break;
            default:
                if (this.teeth >= 18) {
                    this.createCutout(4.4, this.radiusInner - 2);
                }
        }
        if (hasAxleHole) {
            this.createAxleHole(0, 0, xExtension, yExtension, extensionSize);
        }
    }

    private createTeeth(n: number, cut=false, invert=false) {
        const vertices: Array<[number, number]> = [];

        const radiusPitch = n / 2;
        const radiusInner = radiusPitch - 1.2 * (invert ? -1 : 1);
        const radiusOuter = radiusPitch + 0.85 * (invert ? -1 : 1);
        const radiusIntermediate = radiusInner + 0.9 * (invert ? -1 : 1);
    
        for (let i = 0; i < n; i++) {
            const fraction = 2 * Math.PI / n;
            const angle = i * fraction;
    
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

    addPolygon(vertices: Array<[number, number]>) {    
        this.pathStrings.push("M " + vertices[0][0] + " " + vertices[0][1]);
        for (let i = 1; i < vertices.length; i++) {
            const vertex = vertices[i];
            this.pathStrings.push("L " + vertex[0] + " " + vertex[1]);
        }
        this.pathStrings.push("Z");
    }

    addCircle(x: number, y: number, diameter=5) {
        const r = diameter / 2;
        this.pathStrings.push("M " + (x - r) + ", " + y);
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + diameter + ",0");
        this.pathStrings.push("a " + r + "," + r + " 0 1, 0 " + (-diameter) + ",0");
    }

    createCutout(radiusInner: number, radiusOuter: number, margin=0.8) {
        let inner = Math.sqrt(Math.pow(radiusInner, 2.0) - Math.pow(margin, 2.0));
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
        const vertices: Array<[number, number]> = [
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

    private createSVG(): SVGSVGElement {
        const svg = document.createElementNS(SVG_NAMESPACE, "svg");    
        const path = document.createElementNS(SVG_NAMESPACE, "path");    
    
        path.setAttribute("d", this.pathStrings.join(' '));
    
        svg.appendChild(path);
        svg.setAttribute("height", (this.radiusOuter * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("width", (this.radiusOuter * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("viewBox", (-this.radiusOuter) + " " + (-this.radiusOuter) + " " + (2 * this.radiusOuter) + " " + (2 * this.radiusOuter));
        svg.classList.add("gear");
        if (!STANDARD_GEARS.includes(this.teeth)) {
            svg.classList.add("custom");
        }
    
        return svg;
    }

    public static createWormGearSVG(newStyle=false): SVGSVGElement {
        const rxOuter = newStyle ? 7.4 : 4.9;
        const rxInner = 3;
        const ry = newStyle ? 4 : 8;
        const stepCount = newStyle ? 4.8 : 7;
        const yStep = 3.2;
    
        const vertices = [];
    
        const teethOffset = newStyle ? -0.34 : -0.125;
        for (let i = 0; i < stepCount; i++) {
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
    
        for (let i = 0; i < stepCount; i++) {
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
    
        const stringVertices = [];
        for (const vertex of vertices) {
            stringVertices.push(vertex[0] + "," + vertex[1]);
        }
    
        const svg = document.createElementNS(SVG_NAMESPACE, "svg");    
        const polygon = document.createElementNS(SVG_NAMESPACE, "polygon");    
    
        polygon.setAttribute("points", stringVertices.join(' '));
    
        svg.appendChild(polygon);
        svg.setAttribute("height", (ry * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("width", (rxOuter * 2 * PIXELS_PER_MM).toString());
        svg.setAttribute("viewBox", (-rxOuter) + " " + (-ry) + " " + (2 * rxOuter) + " " + (2 * ry));
        svg.classList.add("worm");
        return svg;
    }
}