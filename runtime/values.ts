import { Stmt } from "../frontend/ast.ts";
import Environment from "./environment.ts";

export type ValueType = "null" | "number" | "boolean"| "string" | "object" | "native-fn" | "function" | "void" | "undefined";

export interface RuntimeVal {
    type: ValueType;
}

export interface NullVal extends RuntimeVal {
    type: "null",
    value: null
}

export function MK_NULL () {
    return { type: "null", value: null } as NullVal
}

export interface VoidVal extends RuntimeVal {
    type: "void";
    value: "void";
}

export interface UndefinedVal extends RuntimeVal {
    type: "undefined";
    value: undefined;
}

export function MK_UNDEFINED () {
    return { type: "undefined", value: undefined } as UndefinedVal;
}

export function MK_VOID () {
    return { type: "void", value: "void" } as VoidVal;
}

export interface BooleanVal extends RuntimeVal {
    type: "boolean",
    value: boolean
}

export function MK_BOOL (b = true) {
    return { type: "boolean", value: b } as BooleanVal
}

export interface NumberVal extends RuntimeVal {
    type: "number",
    value: number
}

export interface StringVal extends RuntimeVal {
    type: "string",
    value: string
}

export function MK_STRING(str = "") {
    return { type: "string", value: str } as StringVal;
}

export interface ObjectVal extends RuntimeVal {
    type: "object",
    properties: Map<string, RuntimeVal>;
}

export function MK_NUMBER (n = 0) {
    return { type: "number", value: n } as NumberVal
}

export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal

export interface NativeFnValue extends RuntimeVal {
    type: "native-fn";
    call: FunctionCall;
}

export function MK_NATIVE_FN (call: FunctionCall) {
    return { type: "native-fn", call } as NativeFnValue;
}

export interface FunctionValue extends RuntimeVal {
    type: "function";
    name: string;
    parameters: string[];
    declarationEnv: Environment;
    body: Stmt[];
}

export function MK_OBJECT(properties: Map<string, RuntimeVal>) {
    return { type: "object", properties } as ObjectVal;
}