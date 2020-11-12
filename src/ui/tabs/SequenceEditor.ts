
///<reference path="../../model/Fraction.ts" />
///<reference path="../Connection.ts" />

class SequenceEditor {
    private readonly container: HTMLDivElement;
    private readonly startFractionContainer: HTMLSpanElement;
    private readonly connectionContainer: HTMLSpanElement;
    private readonly resultFractionContainer: HTMLSpanElement;
    private readonly addButtonContainer: HTMLSpanElement;
    private readonly addButton: HTMLButtonElement;
    private readonly permalink: HTMLAnchorElement;
    private readonly animateCheckbox: HTMLInputElement;
    private readonly animateRpmInput: HTMLInputElement;

    private startFraction: Fraction = new Fraction(1);
    private resultFraction: Fraction = new Fraction(1);
    private danglingGear: number | null = null;
    private connections: Connection[] = [];

    constructor(element: HTMLDivElement) {
        this.container = element;

        this.startFractionContainer = document.createElement('span');
        this.container.appendChild(this.startFractionContainer);

        this.connectionContainer = document.createElement('span');
        this.container.appendChild(this.connectionContainer);

        this.resultFractionContainer = document.createElement('span');
        this.container.appendChild(this.resultFractionContainer);
        
        this.addButtonContainer = document.createElement('span');
        this.addButtonContainer.classList.add('add-container');
        this.container.appendChild(this.addButtonContainer);
        this.addButton = document.createElement('button');
        this.addButton.classList.add('add-gear');
        this.addButton.innerText = '+';
        this.addButtonContainer.appendChild(this.addButton);
        
        this.permalink = document.getElementById('editor-permalink') as HTMLAnchorElement;
        this.animateCheckbox = document.getElementById('editor-animate') as HTMLInputElement;
        this.animateRpmInput = document.getElementById('editor-animate-rpm') as HTMLInputElement;

        this.clear();
        this.updateAnimation();

        const sequenceEditor = this
        this.addButton.addEventListener('click', function(event) {
            gearPicker.show(sequenceEditor.addGear.bind(sequenceEditor), sequenceEditor.addButtonContainer);
        });

        this.animateCheckbox.addEventListener('change', function() { sequenceEditor.updateAnimation(); });
        this.animateRpmInput.addEventListener('change', function() { sequenceEditor.updateAnimation(); });
        this.animateRpmInput.addEventListener('keyup', function() { sequenceEditor.updateAnimation(); });

        document.getElementById('clear-sequence')!.addEventListener('click', this.clear.bind(this));
        document.getElementById('reverse')!.addEventListener('click', this.reverse.bind(this));
    }

    private updateDom() {
        this.startFractionContainer.innerText = '';
        this.startFractionContainer.appendChild(this.startFraction.createDiv());
        this.resultFractionContainer.innerText = '';
        if (this.connections.length >= 1) {
            this.resultFractionContainer.appendChild(this.resultFraction.createDiv());
        }
    }

    private addGear(gear: number) {
        if (this.danglingGear == null) {
            this.danglingGear = gear;
            const div = new Connection(gear, 1).createDiv();
            div.classList.add('hide-second');
            
            if (this.connections.length >= 1) {
                this.connectionContainer.appendChild(this.resultFraction.createDiv());
            }            
            this.connectionContainer.appendChild(div);
        } else {
            const connection = new Connection(this.danglingGear, gear);
            this.danglingGear = null;

            this.connectionContainer.removeChild(this.connectionContainer.lastChild!);
            this.connectionContainer.appendChild(connection.createDiv());

            this.connections.push(connection);
            this.resultFraction = this.resultFraction.multiply(connection.fraction);
            this.updateDom();
        }

        this.updatePermalink();
        this.addButton.focus();
        this.updateAnimation();
    }

    private getGears() {
        const gears = [];
        for (const connection of this.connections) {
            gears.push(connection.gear1);
            gears.push(connection.gear2);
        }
        if (this.danglingGear != null) {
            gears.push(this.danglingGear);
        }
        return gears;
    }

    private updatePermalink() {        
        this.permalink.href = '?seq=' + this.getGears().join(',');
    }

    public clear() {
        this.startFraction = new Fraction(1);
        this.resultFraction = new Fraction(1);
        this.danglingGear = null;
        this.connections = [];
        this.updateDom();
        this.connectionContainer.innerText = '';
        this.updatePermalink();
    }

    public setSequence(gears: number[]) {
        this.clear();
        for (const gear of gears) {
            this.addGear(gear);
        }
    }

    private updateAnimation() {
        const animationRotationsPerSecond = this.animateCheckbox.checked ? parseFloat(this.animateRpmInput.value) / 60 : 0;
        for (const connection of this.connections) {
            connection.updateAnimation(animationRotationsPerSecond);
        }
    }

    public reverse() {
        this.setSequence(this.getGears().reverse());
    }

    loadUrlParameters(parameters: ParsedUrlParameters) {
        const gearStrings = parameters["seq"].split(',');
        const gears = [];
        for (const gearString of gearStrings) {
            const gear = parseInt(gearString.trim());
            if (Number.isInteger(gear)) {
                gears.push(gear);
            }
        }
        if (gears.length > 0) {
            this.setSequence(gears);
        }
    }
}