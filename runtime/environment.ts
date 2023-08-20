import createNativeFunctions from "../NativeFunctions/functions.ts";
import { MK_BOOL, MK_NULL, MK_UNDEFINED, MK_VOID, RuntimeVal } from "./values.ts";
import { StaticTypes } from "../frontend/ast.ts";

export function createGlobalEnv() {
    const env = new Environment();
    // default env stuff
    env.declareVar("true", MK_BOOL(true), true, "dynamic");
    env.declareVar("false", MK_BOOL(false), true, "dynamic");
    env.declareVar("null", MK_NULL(), true, "dynamic");
    env.declareVar("void", MK_VOID(), true, "dynamic");
    env.declareVar("undefined", MK_UNDEFINED(), true, "dynamic");

    // native functions
    createNativeFunctions(env);

    return env;
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeVal>;
    private statics: Set<string>
    private types: Record<string, {
        type: StaticTypes,
        varname: string
    }>;

    constructor (parentENV?: Environment) {
        this.parent = parentENV;
        this.variables = new Map();
        this.statics = new Set();
        this.types = {};
    }
    
    public declareVar (varname: string, value: RuntimeVal, isStatic: boolean, type: StaticTypes): RuntimeVal {
        if (this.variables.has(varname)) {
            if (this.variables.get(varname)?.type == "native-fn") {
                throw `You cannot name a variable on top of a native function.`;
            } else {
                throw `Cannot declare variable ${varname}. As it already is defined.`;
            }
        }

        this.variables.set(varname, value);
        this.types[varname] = { varname: varname, type }

        if (isStatic)
            this.statics.add(varname);
        return value;
    }

    public assignVar (varname: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varname);

        // Cannot assign to static variable
        if (env.statics.has(varname)) {
            throw `The variable '${varname}' is a static variable. If you need to change this variable, please use var | let instead.`
        }

        const type = this.types[varname];

        if (value.type !== "string" && type.type === "str") {
            throw `You tried to reassign a string variable with a value which was not a string.`;
        } else if (value.type !== "number" && type.type === "int") {
            throw `You tried to reassign a number variable with a value which was not a number.`;
        }

        env.variables.set(varname, value);
        return value;
    }

    public lookupVar (varname: string): RuntimeVal {
        const env = this.resolve(varname);
        return env.variables.get(varname) as RuntimeVal;
    }

    public resolve (varname: string): Environment {
        if (this.variables.has(varname)) 
            return this;

        if (this.parent == undefined)
            throw `Cannot resolve variable '${varname}' as it does not exist.`

        return this.parent.resolve(varname);
    }
}
