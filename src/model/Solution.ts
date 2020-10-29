class Solution {
    public readonly connections: Connection[];
    private readonly fractions: Fraction[];
    private readonly ratio: Fraction;
    private readonly task: Task;
    public error: number | null = null;

    public domObject: HTMLDivElement | null = null;

    constructor(sequence: Connection[], task: Task) {
        this.connections = sequence;
        this.task = task;
        let currentFraction = new Fraction(1);
        this.fractions = [currentFraction];
        for (const connection of this.connections) {
            currentFraction = currentFraction.multiply(connection.fraction);
            this.fractions.push(currentFraction);
        }
        this.ratio = currentFraction;
        if (!this.task.exact) {
            this.error = Math.abs(this.ratio.getDecimal() / this.task.targetRatio.getDecimal() - 1);
        }
    }

    public createDiv(): HTMLDivElement {
        const div = document.createElement("div");
        div.classList.add("sequence");
        div.appendChild(this.fractions[0].createDiv());

        for (let i = 0; i < this.connections.length; i++) {
            div.appendChild(this.connections[i].createDiv(searchTab.animationSettings.enabled, searchTab.animationSettings.duration / this.fractions[i].getDecimal(), i % 2 == 1));
            div.appendChild(this.fractions[i + 1].createDiv());

            if (i * 2 < this.task.startSequence.length) {
                this.connections[i].svg1!.classList.add("fixed");
            }
            if (i * 2 + 1 < this.task.startSequence.length) {
                this.connections[i].svg2!.classList.add("fixed");
            }
            if (i * 2 >= this.connections.length * 2 - this.task.endSequence.length) {
                this.connections[i].svg1!.classList.add("fixed");
            }
            if (i * 2 + 1 >= this.connections.length * 2 - this.task.endSequence.length) {
                this.connections[i].svg2!.classList.add("fixed");
            }
        }

        let infoDiv = document.createElement("div");
        infoDiv.classList.add("info");
        div.appendChild(infoDiv);
        if (!this.task.exact) {
            const errorSpan = document.createElement('span');
            errorSpan.innerText = 'Error: ' + this.error!.toPrecision(3) + ' ';
            infoDiv.appendChild(errorSpan);
        }
        const permalink = document.createElement('a');
        permalink.innerText = 'Permalink';
        permalink.title = 'Permanent link to this solution';
        permalink.href = this.getPermalink();
        infoDiv.appendChild(permalink);
        this.domObject = div;
        return div;
    }

    public updateAnimation() {
        for (let i = 0; i < this.connections.length; i++) {
            this.connections[i].updateAnimation(searchTab.animationSettings.enabled, searchTab.animationSettings.duration / this.fractions[i].getDecimal());
        }
    }

    private getPermalink() {
        const gears = [];
        for (const connection of this.connections) {
            gears.push(connection.gear1);
            gears.push(connection.gear2);
        }
        return '?seq=' + gears.join(',');
    }
}