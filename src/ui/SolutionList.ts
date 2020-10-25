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
        var count = solution.connections.length;
        if (!(count in this.solutions)) {
            var sizeContainer = document.createElement('div');
            var headline = document.createElement('h2');
            headline.innerText = 'Solutions with ' + count + (count > 1 ? ' connections' : ' connection');
            sizeContainer.appendChild(headline);

            var done = false;
            for (var i = count -1; i > 0; i--) {
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
            var inserted = false;
            for (var i = 0; i < this.solutions[count].length; i++) {
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

    updateAnimation() {
        for (var count in this.solutions) {
            for (var solution of this.solutions[count]) {
                solution.updateAnimation();
            }
        }
    }
}