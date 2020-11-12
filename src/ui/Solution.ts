abstract class Solution {
    public error: number = 0;
    public connections: Connection[] = [];
    public domObject: HTMLDivElement | null = null;
    protected abstract task: Task;
    public abstract readonly numberOfGears: number;

    public abstract createDiv(): HTMLDivElement;

    public updateAnimation(rotationsPerSecond: number) {
        for (let connection of this.connections) {
            connection.updateAnimation(rotationsPerSecond);
        }
    }
}

class SequenceSolution extends Solution {
    protected task: Task;
    public readonly numberOfGears: number;
    
    private readonly sequence: OrderedGears;

    constructor(sequence: OrderedGears, task: Task) {
        super();
        this.task = task;
        this.sequence = sequence;
        this.numberOfGears = sequence.length * 2;

        if (!this.task.exact) {
            this.error = Math.abs(getRatio(sequence).getDecimal() / this.task.targetRatio.getDecimal() - 1);
        }
    }

    public createDiv(): HTMLDivElement {
        const solutionDiv = document.createElement("div");
        solutionDiv.classList.add("solution");
        const div = document.createElement("div");
        div.classList.add("sequence");
        var ratio = new Fraction(1);
        div.appendChild(ratio.createDiv());

        for (let i = 0; i < this.sequence.length; i++) {
            var connection = new Connection(this.sequence[i][0], this.sequence[i][1]);
            connection.rotationSpeed = ratio.getDecimal() * (i % 2 == 0 ? 1 : -1);
            this.connections.push(connection);

            div.appendChild(connection.createDiv());
            ratio = ratio.multiply(connection.fraction);
            div.appendChild(ratio.createDiv());

            if (i * 2 < this.task.startSequence.length) {
                connection.svg1!.classList.add("fixed");
            }
            if (i * 2 + 1 < this.task.startSequence.length) {
                connection.svg2!.classList.add("fixed");
            }
            if (i * 2 >= this.connections.length * 2 - this.task.endSequence.length) {
                connection.svg1!.classList.add("fixed");
            }
            if (i * 2 + 1 >= this.connections.length * 2 - this.task.endSequence.length) {
                connection.svg2!.classList.add("fixed");
            }
        }
        solutionDiv.appendChild(div);

        let infoDiv = document.createElement("div");
        infoDiv.classList.add("info");
        solutionDiv.appendChild(infoDiv);
        if (!this.task.exact) {
            const errorSpan = document.createElement('span');
            errorSpan.innerText = 'Error: ' + this.error.toPrecision(3) + ' ';
            infoDiv.appendChild(errorSpan);
        }
        const permalink = document.createElement('a');
        permalink.innerText = 'Permalink';
        permalink.title = 'Permanent link to this solution';
        permalink.href = this.getPermalink();
        infoDiv.appendChild(permalink);

        this.domObject = solutionDiv;
        return solutionDiv;
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
    public readonly numberOfGears: number;
    
    protected task: Task;

    constructor(data: OrderedGearsWithDifferentials, task: Task) {
        super();
        this.data = data;
        this.task = task;

        this.numberOfGears = (data.primaryLeft.length + data.secondaryLeft.length + data.primaryRight.length + data.secondaryRight.length + data.sharedSequence.length) * 2;
        if (data.primaryLeft.length != 0 || data.secondaryLeft.length != 0) {
            this.numberOfGears += 4;
        }
        if (data.primaryRight.length != 0 || data.secondaryRight.length != 0) {
            this.numberOfGears += 4;
        }
    }
    
    private addSequence(gears: OrderedGears, target: HTMLDivElement, ratio: Fraction) {
        let index = 0;
        for (let [gear1, gear2] of gears) {
            const connection = new Connection(gear1, gear2);
            connection.rotationSpeed = ratio.getDecimal() * (index % 2 == 0 ? 1 : -1);
            index++;
            this.connections.push(connection);
            target.appendChild(connection.createDiv());
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
        const solutionDiv = document.createElement("div");
        solutionDiv.classList.add("solution");
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
            var separator = document.createElement("div");
            separator.classList.add("separator");
            doubleSequenceDiv.appendChild(separator);
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
            var primarySequenceDiv = document.createElement("div");
            primarySequenceDiv.appendChild(ratio1.createDiv());
            this.addSequence(this.data.primaryRight, primarySequenceDiv, ratio1);
            doubleSequenceDiv.appendChild(primarySequenceDiv);
            var separator = document.createElement("div");
            separator.classList.add("separator");
            doubleSequenceDiv.appendChild(separator);
            var secondarySequenceDiv = document.createElement("div");
            secondarySequenceDiv.appendChild(ratio2.createDiv());
            this.addSequence(this.data.secondaryRight, secondarySequenceDiv, ratio2);
            doubleSequenceDiv.appendChild(secondarySequenceDiv);
            div.appendChild(doubleSequenceDiv);
        }
        
        solutionDiv.appendChild(div);
        this.domObject = solutionDiv;
        return solutionDiv;
    }
}