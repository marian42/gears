class Fraction {
    public readonly a: number;
    public readonly b: number;

    constructor(a: number, b=1, reduce=true) {
        this.a = a;
        this.b = b;

        if (!isApproximatelyInteger(this.a) || !isApproximatelyInteger(this.b)) {
            while (!isApproximatelyInteger(this.a) || !isApproximatelyInteger(this.b)) {
                this.a *= 10;
                this.b *= 10;
            }
            this.a = Math.round(this.a);
            this.b = Math.round(this.b);
        }

        if (reduce) {
            const n = greatestCommonDenominator(this.a, this.b);
            this.a /= n;
            this.b /= n;
        }
    }

    public getDecimal(digits: number | null = null) {
        if (digits === null) {
            return this.a / this.b;
        } else {
            return Math.round(this.a / this.b * Math.pow(10, digits)) / Math.pow(10, digits);
        }
    }

    public extend(factor: number) {
        return new Fraction(this.a * factor, this.b * factor, false);
    }

    public multiply(fraction: Fraction) {
        return new Fraction(this.a * fraction.a, this.b * fraction.b);
    }

    public divide(fraction: Fraction) {
        return new Fraction(this.a * fraction.b, this.b * fraction.a);
    }

    public divideByFactor(value: number) {
        return new Fraction(this.a, this.b * value);
    }

    public multiplyByFactor(value: number) {
        return new Fraction(this.a * value, this.b);
    }

    public add(fraction: Fraction) {
        return new Fraction(this.a * fraction.b + fraction.a * this.b, this.b * fraction.b);
    }

    public subtract(fraction: Fraction) {
        return new Fraction(this.a * fraction.b - fraction.a * this.b, this.b * fraction.b);
    }

    public inverse() {
        return new Fraction(this.b, this.a);
    }

    public toString() {
        return this.a + " / " + this.b;
    }

    public createDiv() {
        const result = document.createElement("div");
        result.classList.add("fraction");

        if (this.b == 1) {
            let integer = document.createElement("div");
            integer.classList.add("integer");
            integer.innerText = this.a.toString();
            result.appendChild(integer);
        } else {
            const container = document.createElement("div");
            container.classList.add("fraction-container");
            
            const nominator = document.createElement("div");
            nominator.classList.add("nominator");
            nominator.innerText = this.a.toString();
            container.appendChild(nominator);

            const denominator = document.createElement("div");
            denominator.classList.add("denominator");
            denominator.innerText = this.b.toString();
            container.appendChild(denominator);

            result.appendChild(container);
        }

        const decimal = document.createElement("div");
        decimal.classList.add("decimal");
        decimal.innerText = this.getDecimal(5).toString();
        result.appendChild(decimal);
        return result;
    }

    public static parse(value: string): Fraction {
        if (value.includes('/')) {
            const parts = value.split('/');
            return new Fraction(Number.parseFloat(parts[0].trim()), Number.parseFloat(parts[1].trim()));
        } else {
            return new Fraction(Number.parseFloat(value.trim()));
        }
    }
}