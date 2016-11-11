export declare class Result {
    invalidProps: string[];
    isValid: boolean;
    reasons: {
        [property: string]: string | Result;
    };
    constructor(invalidProps: string[], reasons: any);
}
/** Can be a vallid type as a string or [type] (meaning an array of type) */
export declare type typeDef = string | [string] | Schema;
/** Schema property definition */
export interface PropDef {
    type: typeDef;
    /** Property is optional assumed to be false if undefined */
    optional?: boolean | undefined;
    /** Custom checks to be run on the property */
    rules?: [(val: any, type: typeDef) => boolean | Error];
    /** If the property is an array of items, schemerjs will run registered subrules on each item */
    subRules?: [(val: any, type: typeDef) => boolean | Error];
}
/** An dictionary of propDefs where the key is also the name of the property */
export interface Properties {
    [property: string]: PropDef | typeDef;
}
export declare class Schema {
    validTypes: string[];
    props: Properties;
    constructor(props: Properties);
    private isValidType(type);
    getRequiredProps(): any[];
    private validateArray(array, propDef);
    private validateObjProp(val, propDef);
    validate(obj: any): Result;
}
export declare const rules: {
    messages: {
        max: string;
        min: string;
        regex: string;
    };
    max: (max: number) => (val: any) => string | Error;
    min: (minNum: number) => (val: any) => Error;
    regex: (regStmnt: RegExp) => (str: string) => string | Error;
};
