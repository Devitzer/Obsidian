import { FunctionDeclaration, ImportDeclaration, Program, VarDeclaration, IfDeclaration, BinaryExpr } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal, MK_NULL, MK_NATIVE_FN, MK_OBJECT, FunctionValue, MK_BOOL, BooleanVal } from "../values.ts";
import Native from "../../NativeFunctions/all.ts";
import { areObjectsEqual } from "../../helpers/objects.ts";

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
            fsObj.set("writeFile", MK_NATIVE_FN(Native.fs.writeFile));
            fsObj.set("deleteFile", MK_NATIVE_FN(Native.fs.deleteFile));
            value = fsObj;
        }
    }

    return env.declareVar(declaration.identifier, MK_OBJECT(value), true);
}

export function eval_function_declaration(declaration: FunctionDeclaration, env: Environment): RuntimeVal {
    // Create new function scope

    const fn = {
        type: "function",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body
    } as FunctionValue;

    return env.declareVar(declaration.name, fn, true);
}

export function eval_if_stmt(ifStmt: IfDeclaration, env: Environment): RuntimeVal {
    // Testing if the condition of the ifStmt is true.
    let test: BooleanVal = MK_BOOL(false);

    for (const expr of ifStmt.test) {
        if (expr.kind !== "BinaryExpr") {
            throw `Expected a Binary Expression for an if test. Example: 1 == 1`;
        }
        
        const binaryexpr = expr as BinaryExpr

        switch (binaryexpr.operator) {
            case "==":
                if (binaryexpr.left.kind == binaryexpr.right.kind) {
                    const evaled = evaluate(binaryexpr.left, env);
                    const evaled2 = evaluate(binaryexpr.right, env);

                    if (areObjectsEqual(evaled, evaled2)) {
                        test = MK_BOOL(true);
                    } else {
                        test = MK_BOOL(false)
                    }
                } else {
                    test = MK_BOOL(false);
                }
                break
            
            default:
                throw `Operator not allowed to be used in If Statement.`
        }
    }

    if (test.value === true) {
        for (const stmt of ifStmt.body) {
            evaluate(stmt, env);    
        }
    }

    return test;
}