import createNativeFunctions from "../NativeFunctions/functions.ts";
import { MK_BOOL, MK_NULL, RuntimeVal } from "./values.ts";

export function createGlobalEnv() {
    const env = new Environment();
    // default env stuff
    env.declareVar("true", MK_BOOL(true), true);
    env.declareVar("false", MK_BOOL(false), true);
    env.declareVar("null", MK_NULL(), true);

    // native functions
    createNativeFunctions(env);

    return env;
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeVal>;
    private statics: Set<string>

    constructor (parentENV?: Environment) {
        this.parent = parentENV;
        this.variables = new Map();
        this.statics = new Set();
    }
    
    public declareVar (varname: string, value: RuntimeVal, isStatic: boolean): RuntimeVal {
        if (this.variables.has(varname)) {
            if (this.variables.get(varname)?.type == "native-fn") {
                throw `You cannot name a variable on top of a native function.`;
            } else {
                throw `Cannot declare variable ${varname}. As it already is defined.`;
            }
        }

        this.variables.set(varname, value);

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
