
function getOnCircle(angle, radius) {
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

function createGear(n) {
    const radiusPitch = n / 2;
    const radiusInner = radiusPitch - 1.35;
    const radiusOuter = radiusPitch + 0.85;
    const radiusIntermediate = radiusInner + 0.9;

    const svgNamespace = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNamespace, "svg");

    var polygon = document.createElementNS(svgNamespace, "polygon");

    var vertices = [];

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

    var verticesStrings = [];
    for (var vertex of vertices) {
        verticesStrings.push(vertex[0] + "," + vertex[1]);
    }
    polygon.setAttribute("points", verticesStrings.join(' '));

    svg.appendChild(polygon);
    svg.setAttribute("height", radiusOuter * 10);
    svg.setAttribute("width", radiusOuter * 10);
    svg.setAttribute("viewBox", (-radiusOuter) + " " + (-radiusOuter) + " " + (2 * radiusOuter) + " " + (2 * radiusOuter));
    svg.setAttribute("class", "gear")

    return svg;
}

const gears = [8, 16, 24, 40, 12, 20, 36];

for (var n of gears) {
    document.body.appendChild(createGear(n));
}
