import { ImportDeclaration, Program, VarDeclaration } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal, MK_NULL, MK_NATIVE_FN, MK_OBJECT } from "../values.ts";
import Native from "../../NativeFunctions/all.ts";

export function eval_program (program: Program, env: Environment): RuntimeVal {
    let lastEvaluated: RuntimeVal = MK_NULL();
    for (const statement of program.body) {
        lastEvaluated = evaluate(statement, env);
    }
    return lastEvaluated;
}

export function eval_var_declaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
    const value = declaration.value ? evaluate(declaration.value, env) : MK_NULL();
    return env.declareVar(declaration.identifier, value, declaration.static);
}

export function eval_import_declaration(declaration: ImportDeclaration, env: Environment): RuntimeVal {
    const fsObj: Map<string, RuntimeVal> = new Map();
    let value: Map<string, RuntimeVal>;
    value = fsObj;
    if (declaration.builtInLibrary == true) {
        if (declaration.identifier == "fs") {
            fsObj.set("readFile", MK_NATIVE_FN(Native.fs.readFile));
            value = fsObj;
        }
    }

    return env.declareVar(declaration.identifier, MK_OBJECT(value), true);
}