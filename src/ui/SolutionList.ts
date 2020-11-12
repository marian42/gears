class SolutionList {
    private readonly container: HTMLDivElement;
    private readonly solutions: {[count: number]: Solution[]} = {};
    private readonly sizeContainers: {[count: number]: HTMLDivElement} = {};
    private readonly task: Task;
    public totalSolutions: number = 0;
    private smallestError: number | null = null;

    constructor(container: HTMLDivElement, task: Task) {
        this.container = container;
        this.container.textContent = '';
        this.task = task;
    }

    public add(solution: Solution) {
        const count = solution.numberOfGears;
        if (!(count in this.solutions)) {
            const sizeContainer = document.createElement('div');
            const headline = document.createElement('h2');
            headline.innerText = 'Solutions with ' + count + " gears";
            sizeContainer.appendChild(headline);

            let done = false;
            for (let i = count -1; i > 0; i--) {
                if (i in this.sizeContainers) {
                    this.container.insertBefore(sizeContainer, this.sizeContainers[i].nextSibling);
                    done = true;
                    break;
                }
            }
            if (!done) {
                this.container.insertBefore(sizeContainer, this.container.firstChild);
            }

            this.sizeContainers[count] = sizeContainer;
            this.solutions[count] = [];
        }

        if (this.task.exact) {
            this.sizeContainers[count].appendChild(solution.createDiv());
            this.solutions[count].push(solution);
        } else {
            let inserted = false;
            for (let i = 0; i < this.solutions[count].length; i++) {
                if (this.solutions[count][i].error! > solution.error!) {
                    this.sizeContainers[count].insertBefore(solution.createDiv(), this.solutions[count][i].domObject);
                    this.solutions[count].splice(i, 0, solution);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                this.sizeContainers[count].appendChild(solution.createDiv());
                this.solutions[count].push(solution);
            }
        }
        this.totalSolutions++;
        document.getElementById('resultcount')!.innerText = this.totalSolutions.toString();
        if (!this.task.exact &&(this.smallestError === null || solution.error! < this.smallestError)) {
            this.smallestError = solution.error!;
            document.getElementById('smallest-error')!.innerText = this.smallestError!.toPrecision(3);
        }
    }

    updateAnimation(rotationsPerSecond: number) {
        for (const count in this.solutions) {
            for (const solution of this.solutions[count]) {
                solution.updateAnimation(rotationsPerSecond);
            }
        }
    }
}