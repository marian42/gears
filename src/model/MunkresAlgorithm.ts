

type Matrix = number[][];

enum State {
    None,
    Starred,
    Primed
}

// Munkres Algorithm aka Hungarian Algorithm based on https://brc2.com/the-algorithm-workshop/
class MunkresAlgorithm {
    private matrix: Matrix;
    private rowsCovered: boolean[];
    private columnsCovered: boolean[];
    private readonly size: number;
    private zero0: [number, number];
    private state: State[][];
    private path: Array<[number, number]>;

    constructor(costMatrix: Matrix) {
        this.matrix = [];
        for (const row of costMatrix) {
            this.matrix.push(row.slice());
        }
        
        this.size = this.matrix.length;

        this.rowsCovered = [];
        this.columnsCovered = [];
        for (let i = 0; i < this.size; i++) {
            this.rowsCovered.push(false);
            this.columnsCovered.push(false);
        }
        this.path = [];
        for (let i = 0; i < this.size * 2; i++) {
            this.path.push([0, 0]);
        }
        this.zero0 = [0, 0];

        this.state = new Array<Array<State>>(this.size);
        for (let i = 0; i < this.size; i++) {
            this.state[i] = new Array<State>(this.size);
            for (let j = 0; j < this.size; j++) {
                this.state[i][j] = State.None;
            }
        }
    };

    run(): Array<[number, number]> {
        let nextStep = 1;

        const stepImplementations: {[step: number]: () => number } = [
            this.step1,
            this.step2,
            this.step3,
            this.step4,
            this.step5,
            this.step6 
        ];

        while (nextStep != -1) {
            nextStep = stepImplementations[nextStep - 1].apply(this);
        }

        const selectedIndices: Array<[number, number]> = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.state[i][j] == State.Starred) {
                    selectedIndices.push([i, j]);
                }
            }                    
        }
        
        return selectedIndices;
    }
    
    private step1() {
        for (let i = 0; i < this.size; i++) {
            const rowMinimum = Math.min.apply(Math, this.matrix[i]);
            for (let j = 0; j < this.size; j++) {
                this.matrix[i][j] -= rowMinimum;
            }
        }

        return 2;
    };

    private step2() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.matrix[i][j] == 0 && !this.rowsCovered[i] && !this.columnsCovered[j]) {
                    this.state[i][j] = State.Starred;
                    this.rowsCovered[i] = true;
                    this.columnsCovered[j] = true;
                    break;
                }
            }
        }

        this.resetCovered();

        return 3;
    };

    private step3() {
        let count = 0;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.state[i][j] == State.Starred && this.columnsCovered[j] == false) {
                    this.columnsCovered[j] = true;
                    count++;
                }
            }
        }

        if (count >= this.size) {
            return -1;
        } else {
            return 4;
        }
    };

    private step4() {
        while (true) {
            let [row, column] = this.findAZero();

            if (row < 0) {
                return 6;
            }

            this.state[row][column] = State.Primed;

            const starredColumn = this.findStarInRow(row);
            if (starredColumn >= 0) {
                column = starredColumn;
                this.rowsCovered[row] = true;
                this.columnsCovered[column] = false;
            } else {
                this.zero0 = [row, column];
                return 5;
            }
        }
    };

    private step5() {
        let count = 0;

        this.path[count][0] = this.zero0[0];
        this.path[count][1] = this.zero0[1];

        let done = false;

        while (!done) {
            const row = this.findStarInColumn(this.path[count][1]);
            if (row >= 0) {
                count++;
                this.path[count][0] = row;
                this.path[count][1] = this.path[count-1][1];
            } else {
                done = true;
            }

            if (!done) {
                const column = this.findPrimeInRow(this.path[count][0]);
                count++;
                this.path[count][0] = this.path[count - 1][0];
                this.path[count][1] = column;
            }
        }

        this.convertPath(count);
        this.resetCovered();
        this.resetPrimes();
        return 3;
    };
    
    private step6() {
        const smallestUncovered = this.findSmallestUncovered();

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.rowsCovered[i]) {
                    this.matrix[i][j] += smallestUncovered;
                }
                if (!this.columnsCovered[j]) {
                    this.matrix[i][j] -= smallestUncovered;
                }
            }
        }

        return 4;
    };

    private findSmallestUncovered() {
        let result = ASSIGNMENT_COST_FORBIDDEN;

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (!this.rowsCovered[i] && !this.columnsCovered[j] && result > this.matrix[i][j]) {
                    result = this.matrix[i][j];
                }
            }
        }

        return result;
    };
    
    private findAZero(): [number, number] {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.matrix[i][j] == 0 && !this.rowsCovered[i] && !this.columnsCovered[j]) {
                    return [i, j];
                }
            }
        }

        return [-1, -1];
    };

    private findStarInRow(row: number) {
        for (let j = 0; j < this.size; j++) {
            if (this.state[row][j] == State.Starred) {
                return j;
            }
        }

        return -1;
    };

    private findStarInColumn(column: number) {
        for (let i = 0; i < this.size; i++) {
            if (this.state[i][column] == State.Starred) {
                return i;
            }
        }

        return -1;
    };

    private findPrimeInRow(row: number) {
        for (let j = 0; j < this.size; j++) {
            if (this.state[row][j] == State.Primed) {
                return j;
            }
        }

        return -1;
    };

    private convertPath(count: number) {
        for (let i = 0; i <= count; i++) {
            const [x, y] = this.path[i];
            this.state[x][y] = (this.state[x][y] == State.Starred) ? State.None : State.Starred;
        }
    };

    private resetCovered() {
        for (let i = 0; i < this.size; i++) {
            this.rowsCovered[i] = false;
            this.columnsCovered[i] = false;
        }
    };

    private resetPrimes() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.state[i][j] == State.Primed) {
                    this.state[i][j] = State.None;
                }
            }
        }
    };
}