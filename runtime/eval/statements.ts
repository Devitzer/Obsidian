import { FunctionDeclaration, ImportDeclaration, Program, VarDeclaration, IfDeclaration, BinaryExpr, BlockStatement } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal, MK_NULL, MK_NATIVE_FN, MK_OBJECT, FunctionValue, MK_BOOL, BooleanVal } from "../values.ts";
import Native from "../../NativeFunctions/all.ts";
import { areObjectsEqual } from "../../helpers/objects.ts";

function eval_if_test(binaryexpr: BinaryExpr, env: Environment): BooleanVal {
        const evaled = evaluate(binaryexpr.left, env);
        const evaled2 = evaluate(binaryexpr.right, env);

        if (areObjectsEqual(evaled, evaled2)) {
            return MK_BOOL(true);
        } else {
            return MK_BOOL(false)
        }
}

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
    const diagnosticsObj: Map<string, RuntimeVal> = new Map();
    let value: Map<string, RuntimeVal> = new Map();
    if (declaration.builtInLibrary == true) {
        if (declaration.identifier == "fs") {
            fsObj.set("readFile", MK_NATIVE_FN(Native.fs.readFile));
            fsObj.set("writeFile", MK_NATIVE_FN(Native.fs.writeFile));
            fsObj.set("deleteFile", MK_NATIVE_FN(Native.fs.deleteFile));
            value = fsObj;
        } else if (declaration.identifier == "diagnostics") {
            diagnosticsObj.set("time", MK_NATIVE_FN(Native.diagnostics.time));
            diagnosticsObj.set("timeEnd", MK_NATIVE_FN(Native.diagnostics.timeEnd));
            value = diagnosticsObj;
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

export function eval_if_stmt(ifStmt: IfDeclaration, env: Environment): BooleanVal {
    // Testing if the condition of the ifStmt is true.
    let test: BooleanVal = MK_BOOL(false);

    for (const expr of ifStmt.test) {
        if (expr.kind !== "BinaryExpr") {
            throw `Expected a Binary Expression for an if test. Example: 1 == 1`;
        }
        
        const binaryexpr = expr as BinaryExpr

        switch (binaryexpr.operator) {
            case "==": {
                test = eval_if_test(binaryexpr, env);
                if (test.value === true) {
                    break
                }
                let ifStmtNONULL: BlockStatement | IfDeclaration | undefined;
                
                if (ifStmt.alternate !== null) {
                    ifStmtNONULL = ifStmt.alternate as BlockStatement | IfDeclaration;
                }

                if (ifStmtNONULL?.kind === "IfDeclaration") {
                    const alternateAsIf = ifStmt.alternate as IfDeclaration;
                    eval_if_stmt(alternateAsIf, env);
                } else if (ifStmtNONULL?.kind === "BlockStatement" && test.value === false) {
                    const alternateAsBlock = ifStmt.alternate as BlockStatement
                    for (const stmt of alternateAsBlock.body) {
                        evaluate(stmt, env);
                    }
                }
                break
            }
            
            default:
                throw `Operator not allowed to be used in If Statement.`
        }
    }

    if (test.value === true) {
        for (const stmt of ifStmt.body.body) {
            evaluate(stmt, env);   
        }
    }

    return test;
}