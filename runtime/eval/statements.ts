import { FunctionDeclaration, ImportDeclaration, Program, VarDeclaration, IfDeclaration, BinaryExpr, BlockStatement, ExportDeclaration, Identifier } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { RuntimeVal, MK_NULL, MK_NATIVE_FN, MK_OBJECT, FunctionValue, MK_BOOL, BooleanVal, MK_VOID } from "../values.ts";
import Native from "../../NativeFunctions/all.ts";
import { areObjectsEqual } from "../../helpers/objects.ts";
import Parser from "../../frontend/parser.ts";

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
    return env.declareVar(declaration.identifier, value, declaration.static, declaration.type);
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
    } else {
        const module = Deno.readTextFileSync(declaration.identifier);
        const parseModule = new Parser();
        const program = parseModule.produceAST(module);
        for (const stmt of program.body) {
            if (stmt.kind === "ExportDeclaration") {
            const exportModule = stmt as ExportDeclaration;
            let exportedStuff: FunctionDeclaration | Identifier[];
            const specAsFunc = exportModule.specifiers as FunctionDeclaration;
            const specAsIdentArr = exportModule.specifiers as Identifier[];
            
            if (specAsFunc.name !== undefined) {
                exportedStuff = specAsFunc;
                value.set(exportedStuff.name, evaluate(exportedStuff, env));
            } else if (specAsIdentArr[0].symbol !== undefined) {
                exportedStuff = specAsIdentArr;
                for (let i = 0; i < exportedStuff.length; i++) {
                    value.set(exportedStuff[i].symbol, evaluate(exportedStuff[i], env));
                }
            } else {
                throw `Couldn't nail down exported stuff's type, here is what we got for reference: ` + exportModule.specifiers;
            }
        } else if (stmt.kind === "VarDeclaration") {
            const declaration = stmt as VarDeclaration
            value.set(declaration.identifier, evaluate(declaration, env));
        } else if (stmt.kind === "FunctionDeclaration") {
            const declaration = stmt as FunctionDeclaration;
            value.set(declaration.name, evaluate(declaration, env));
        }
    }
}

    return env.declareVar(declaration.identifier, MK_OBJECT(value), true, "dynamic");
}

export function eval_export_declaration(declaration: ExportDeclaration, env: Environment): RuntimeVal {
    let exportedStuff: FunctionDeclaration | Identifier[];
    const specAsFunc = declaration.specifiers as FunctionDeclaration;
    const specAsIdentArr = declaration.specifiers as Identifier[];
    if (specAsFunc.name !== undefined) {
        exportedStuff = specAsFunc;
        return evaluate(exportedStuff, env);
    } else if (specAsIdentArr[0].symbol !== undefined) {
        exportedStuff = specAsIdentArr;
        for (let i = 0; i < exportedStuff.length; i++) {
            return evaluate(exportedStuff[i], env);
        }
    } else {
        throw `Couldn't nail down exported stuff's type, here is what we got for reference: ` + declaration.specifiers;
    }
    return MK_VOID();
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

    return env.declareVar(declaration.name, fn, true, "dynamic");
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