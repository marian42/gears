abstract class Solution {
    public error: number = 0;
    public connections: Connection[] = [];
    public domObject: HTMLDivElement | null = null;
    protected abstract task: Task;

    public abstract createDiv(): HTMLDivElement;
    public abstract updateAnimation(): void;
}

class SequenceSolution extends Solution {
    private readonly fractions: Fraction[];
    
    protected task: Task;
    
    private readonly sequence: OrderedGears;

    constructor(sequence: OrderedGears, task: Task) {
        super();
        this.task = task;
        this.sequence = sequence;
        
        let currentFraction = new Fraction(1);
        this.fractions = [currentFraction];
        for (let [gear1, gear2] of this.sequence) {
            currentFraction = currentFraction.multiply(new Fraction(gear1, gear2));
            this.fractions.push(currentFraction);
        }
        if (!this.task.exact) {
            this.error = Math.abs(currentFraction.getDecimal() / this.task.targetRatio.getDecimal() - 1);
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

function getRatio(gears: OrderedGears) {
    let a = 1;
    let b = 1;
    for (let [gear1, gear2] of gears) {
        a *= gear1;
        b *= gear2;
    }
    return new Fraction(a, b);
}

class DifferentialSolution extends Solution {
    private readonly data: OrderedGearsWithDifferentials;
    
    protected task: Task;

    constructor(data: OrderedGearsWithDifferentials, task: Task) {
        super();
        this.data = data;
        this.task = task;
    }

    private createParallelConnections(sequence1: OrderedGears, sequence2: OrderedGears): HTMLDivElement {
        const div = document.createElement("div");

        return div;
    }

    private addSequence(gears: OrderedGears, target: HTMLDivElement, ratio: Fraction) {
        for (let [gear1, gear2] of gears) {
            const connection = new Connection(gear1, gear2);
            this.connections.push(connection);
            target.appendChild(connection.createDiv(false));
            ratio = ratio.multiply(connection.fraction);
            target.appendChild(ratio.createDiv());
        }
    }

    private createDifferentialCasing(): HTMLDivElement {
        var differentialDiv = document.createElement("div");
        differentialDiv.classList.add("connection");
        differentialDiv.appendChild(DifferentialCasingSVGGenerator.createDifferentialCasing());
        var descriptionDiv = document.createElement("div");
        descriptionDiv.classList.add("distance");
        descriptionDiv.innerText = "Differential Casing";
        differentialDiv.appendChild(descriptionDiv);
        return differentialDiv;
    }

    public createDiv(): HTMLDivElement {
        const div = document.createElement("div");
        div.classList.add("sequence");
        
        var ratio = new Fraction(1);

        if (this.data.primaryLeft.length != 0 || this.data.secondaryLeft.length != 0) {
            var doubleSequenceDiv = document.createElement("div");
            doubleSequenceDiv.classList.add("double-sequence");
            doubleSequenceDiv.classList.add("left");
            var primarySequenceDiv = document.createElement("div");
            primarySequenceDiv.appendChild(ratio.createDiv());
            this.addSequence(this.data.primaryLeft, primarySequenceDiv, ratio);
            doubleSequenceDiv.appendChild(primarySequenceDiv);
            var secondarySequenceDiv = document.createElement("div");
            secondarySequenceDiv.appendChild(ratio.createDiv());
            this.addSequence(this.data.secondaryLeft, secondarySequenceDiv, ratio);
            doubleSequenceDiv.appendChild(secondarySequenceDiv);
            div.appendChild(doubleSequenceDiv);
            div.appendChild(this.createDifferentialCasing());

            ratio = ratio.multiply(getRatio(this.data.primaryLeft).add(getRatio(this.data.secondaryLeft)).divideByFactor(2));
            div.appendChild(ratio.createDiv());
        } else {
            div.appendChild(ratio.createDiv());
        }
        
        if (this.data.sharedSequence.length != 0) {
            this.addSequence(this.data.sharedSequence, div, ratio);
            ratio = ratio.multiply(getRatio(this.data.sharedSequence));
        }

        if (this.data.primaryRight.length != 0 || this.data.secondaryRight.length != 0) {
            div.appendChild(this.createDifferentialCasing());
            var primarySequenceRatio = getRatio(this.data.primaryRight);
            var secondarySequenceRatio = getRatio(this.data.secondaryRight);
            var offset = ratio.multiply(primarySequenceRatio).subtract(ratio.multiply(secondarySequenceRatio)).divide(primarySequenceRatio.add(secondarySequenceRatio));
            var ratio1 = ratio.subtract(offset);
            var ratio2 = ratio.add(offset);

            var doubleSequenceDiv = document.createElement("div");
            doubleSequenceDiv.classList.add("double-sequence");
            doubleSequenceDiv.classList.add("left");
            var primarySequenceDiv = document.createElement("div");
            primarySequenceDiv.appendChild(ratio1.createDiv());
            this.addSequence(this.data.primaryRight, primarySequenceDiv, ratio1);
            doubleSequenceDiv.appendChild(primarySequenceDiv);
            var secondarySequenceDiv = document.createElement("div");
            secondarySequenceDiv.appendChild(ratio2.createDiv());
            this.addSequence(this.data.secondaryRight, secondarySequenceDiv, ratio2);
            doubleSequenceDiv.appendChild(secondarySequenceDiv);
            div.appendChild(doubleSequenceDiv);
        }
        
        this.domObject = div;
        return div;
    }

    public updateAnimation(): void {
        
    }

}