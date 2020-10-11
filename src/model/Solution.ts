class Solution {
    public readonly connections: Connection[];
    private readonly fractions: Fraction[];
    private readonly ratio: Fraction;
    public error: number | null = null;

    public domObject: HTMLDivElement | null = null;

    constructor(sequence: Connection[]) {
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

    public createDiv(): HTMLDivElement {
        var div = document.createElement("div");
        div.classList.add("sequence");
        div.appendChild(this.fractions[0].createDiv());

        for (var i = 0; i < this.connections.length; i++) {
            div.appendChild(this.connections[i].createDiv(animationSettings.enabled, animationSettings.duration / this.fractions[i].getDecimal(), i % 2 == 1));
            div.appendChild(this.fractions[i + 1].createDiv());

            if (i * 2 < currentTask.startSequence.length) {
                this.connections[i].svg1!.classList.add("fixed");
            }
            if (i * 2 + 1 < currentTask.startSequence.length) {
                this.connections[i].svg2!.classList.add("fixed");
            }
            if (i * 2 >= this.connections.length * 2 - currentTask.endSequence.length) {
                this.connections[i].svg1!.classList.add("fixed");
            }
            if (i * 2 + 1 >= this.connections.length * 2 - currentTask.endSequence.length) {
                this.connections[i].svg2!.classList.add("fixed");
            }
        }

        var infoDiv = document.createElement("div");
        infoDiv.classList.add("info");
        div.appendChild(infoDiv);
        if (!currentTask.exact) {
            var errorSpan = document.createElement('span');
            errorSpan.innerText = 'Error: ' + this.error!.toPrecision(3) + ' ';
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

    public updateAnimation() {
        for (var i = 0; i < this.connections.length; i++) {
            this.connections[i].updateAnimation(animationSettings.enabled, animationSettings.duration / this.fractions[i].getDecimal());
        }
    }

    private getPermalink() {
        var gears = [];
        for (var connection of this.connections) {
            gears.push(connection.gear1);
            gears.push(connection.gear2);
        }
        return '?seq=' + gears.join(',');
    }
}