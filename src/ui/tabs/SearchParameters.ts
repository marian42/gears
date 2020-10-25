type ParsedUrlParameters = {[key: string]: string};

abstract class SearchParameter<T> {
    public readonly defaultValue: T;
    public readonly urlKey: string;

    constructor(defaultValue: T, urlKey: string) {
        this.defaultValue = defaultValue;
        this.urlKey = urlKey;
    }

    public abstract getFromDOM(): T;
    public abstract setInDom(value: T): void;

    protected abstract toString(value: T): string;
    protected abstract fromString(value: string): T;

    public getUrlKeyValuePairFromDOM(): string | null {
        var value = this.getFromDOM();
        if (JSON.stringify(value) == JSON.stringify(this.defaultValue)) {
            return null;
        } else {
            return this.urlKey + "=" + this.toString(value);
        }
    }

    public setFromUrl(urlParameters: ParsedUrlParameters) {
        if (this.urlKey in urlParameters) {
            this.setInDom(this.fromString(urlParameters[this.urlKey]));
        } else {
            this.setInDom(this.defaultValue);
        }
    }

    public reset() {
        this.setInDom(this.defaultValue);
    }

    public isDefault(urlParameters: ParsedUrlParameters): boolean {
        if (this.urlKey in urlParameters) {
            return JSON.stringify(this.fromString(urlParameters[this.urlKey])) == JSON.stringify(this.defaultValue);
        } else {
            return true;
        }
    }
}

abstract class InputElementSearchParameter<T> extends SearchParameter<T> {
    private readonly domElement: HTMLInputElement;

    constructor(defaultValue: T, urlKey: string, domElementID: string) {
        super(defaultValue, urlKey);
        this.domElement = document.getElementById(domElementID) as HTMLInputElement;
    }

    public getFromDOM(): T {
        return this.fromString(this.domElement.value);
    }
    public setInDom(value: T): void {
        this.domElement.value = this.toString(value);
    }
}

class NumberSearchParameter extends InputElementSearchParameter<number> {
    constructor(defaultValue: number, urlKey: string, domElementID: string) {
        super(defaultValue, urlKey, domElementID);
    }
    protected toString(value: number): string {
        return value.toString();
    }
    protected fromString(value: string): number {
        return Number.parseFloat(value);
    }
}

class StringSearchParameter extends InputElementSearchParameter<string> {
    constructor(defaultValue: string, urlKey: string, domElementID: string) {
        super(defaultValue, urlKey, domElementID);
    }
    protected toString(value: string): string {
        return value;
    }
    protected fromString(value: string): string {
        return value;
    }
}

class BooleanSearchParameter extends SearchParameter<boolean> {
    private readonly domElement: HTMLInputElement;

    constructor(defaultValue: boolean, urlKey: string, domElementID: string) {
        super(defaultValue, urlKey);
        this.domElement = document.getElementById(domElementID) as HTMLInputElement;
    }

    public getFromDOM(): boolean {
        return this.domElement.checked;
    }

    public setInDom(value: boolean): void {
        this.domElement.checked = value;
    }
    protected toString(value: boolean): string {
        return value ? "true" : "false";
    }
    protected fromString(value: string): boolean {
        return value == "true";
    }
}

class GearListSearchParameter extends InputElementSearchParameter<number[]> {
    constructor(defaultValue: number[], urlKey: string, domElementID: string) {
        super(defaultValue, urlKey, domElementID);
    }
    protected toString(value: number[]): string {
        return value.join(", ");
    }
    protected fromString(value: string): number[] {
        var items = value.split(",");
        var result: number[] = [];
        for (var item of items) {
            var gear = Number.parseInt(item.trim());
            if (!Number.isNaN(gear)) {
                result.push(gear);
            }
        }
        return result;
    }
}

type CheckableValue<T> = { value: T, checked: boolean };

class CheckboxedSearchParameter<T> extends SearchParameter<CheckableValue<T>> {
    private readonly targetSearchParameter: SearchParameter<T>;
    private readonly checkbox: HTMLInputElement;

    constructor(targetSearchParameter: SearchParameter<T>, checkedByDefault: boolean, checkboxID: string) {
        super({ value: targetSearchParameter.defaultValue, checked: checkedByDefault }, targetSearchParameter.urlKey);
        this.targetSearchParameter = targetSearchParameter;
        this.checkbox = document.getElementById(checkboxID) as HTMLInputElement;
    }

    public getFromDOM(): CheckableValue<T> {
        return {
            value: this.targetSearchParameter.getFromDOM(),
            checked: this.checkbox.checked
        }
    }

    public setInDom(value: CheckableValue<T>): void {
        this.targetSearchParameter.setInDom(value.value);
        this.checkbox.checked = value.checked;
    }

    protected toString(value: CheckableValue<T>): string {
        throw new Error("Method not implemented.");
    }
    protected fromString(value: string): CheckableValue<T> {
        throw new Error("Method not implemented.");
    }

    public getUrlKeyValuePairFromDOM(): string | null {
        var value = this.getFromDOM();
        if (!value.checked) {
            return null;
        } else if (JSON.stringify(value.value) == JSON.stringify(this.targetSearchParameter.defaultValue)) {
            return this.urlKey + '=default';
        } else {
            return this.targetSearchParameter.getUrlKeyValuePairFromDOM();
        }
    }

    public setFromUrl(urlParameters: ParsedUrlParameters) {
        if (this.urlKey in urlParameters && urlParameters[this.urlKey] != 'default') {
            this.targetSearchParameter.setFromUrl(urlParameters);
        } else {
            this.targetSearchParameter.setInDom(this.targetSearchParameter.defaultValue);
        }
        
        this.checkbox.checked = this.urlKey in urlParameters;
    }

    public isDefault(urlParameters: ParsedUrlParameters): boolean {
        if (this.urlKey in urlParameters && urlParameters[this.urlKey] != 'default') {
            return this.targetSearchParameter.isDefault(urlParameters);
        } else {
            return true;
        }
    }
}

class DistanceParameter extends SearchParameter<number | null> {
    private readonly halfRadioButton = document.getElementById("half") as HTMLInputElement;
    private readonly fullRadioButton = document.getElementById("full") as HTMLInputElement;
    private readonly anyRadioButton = document.getElementById("any") as HTMLInputElement;

    constructor(defaultValue: number | null, urlKey: string) {
        super(defaultValue, urlKey);
    }

    public getFromDOM(): number | null {
        if (this.halfRadioButton.checked) {
            return 0.5;
        } else if (this.fullRadioButton.checked) {
            return 1.0;
        } else if (this.anyRadioButton.checked) {
            return null;
        }
        throw new Error("No radio button is selected.");
    }
    public setInDom(value: number | null): void {
        switch(value) {
            case null:
                this.anyRadioButton.checked = true;
                break;
            case 0.5:
                this.halfRadioButton.checked = true;
                break;
            case 1.0:
                this.fullRadioButton.checked = true;
                break;
            default:
                throw new Error("Invalid value for gear distance.");
        }
    }
    protected toString(value: number | null): string {
        switch(value) {
            case null:
                return "any";
            case 0.5:
                return "half";
            case 1.0:
                return "full";
            default:
                throw new Error("Invalid value for gear distance.");
        }
    }
    protected fromString(value: string): number | null {
        const map: { [key: string] : number | null; } = {"any": null, "half": 0.5, "full": 1.0};
        return map[value];
    }
    
}