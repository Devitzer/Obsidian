// deno-lint-ignore-file no-unused-vars

// This file is technically a compiler, not an interpreter. Interpreter just sounds better
import { RuntimeVal, NumberVal, StringVal } from "./values.ts";
import { BinaryExpr, NodeType, NumericLiteral, Program, Stmt, Identifier, VarDeclaration, AssignmentExpr, StringLiteral, ObjectLiteral, CallExpr, MemberExpr, ImportDeclaration } from "../frontend/ast.ts";
import Environment from "./environment.ts";
import { eval_identifier, eval_binary_expr, eval_assignment, eval_object_expr, eval_call_expr, eval_member_expr } from "./eval/expressions.ts";
import { eval_program, eval_var_declaration, eval_import_declaration } from "./eval/statements.ts";

export function evaluate(astNode: Stmt, env: Environment): RuntimeVal {
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                value: ((astNode as NumericLiteral).value), 
                type: "number" 
            } as NumberVal;
        case "Identifier":
            return eval_identifier(astNode as Identifier, env);
        case "AssignmentExpr":
            return eval_assignment(astNode as AssignmentExpr, env);
        case "BinaryExpr":
            return eval_binary_expr(astNode as BinaryExpr, env);
        case "Program":
            return eval_program(astNode as Program, env);
        case "VarDeclaration":
            return eval_var_declaration(astNode as VarDeclaration, env);
        case "StringLiteral":
            return { value: ((astNode as StringLiteral).value), type: "string" } as StringVal
        case "CallExpr":
            return eval_call_expr(astNode as CallExpr, env);
        case "ObjectLiteral":
            return eval_object_expr(astNode as ObjectLiteral, env);
        case "MemberExpr":
            return eval_member_expr(astNode as MemberExpr, env);
        case "ImportDeclaration":
            return eval_import_declaration(astNode as ImportDeclaration, env);

        default:
            console.error("This AST node has not yet been setup for interpretation. \n", astNode);
            Deno.exit(0);
    }
}
