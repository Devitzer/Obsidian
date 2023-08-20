import { AssignmentExpr, BinaryExpr,CallExpr,Expr,Identifier, MemberExpr, ObjectLiteral } from "../../frontend/ast.ts";
import Environment from "../environment.ts";
import { evaluate } from "../interpreter.ts";
import { NumberVal, MK_NUMBER, RuntimeVal, MK_NULL, ObjectVal, NativeFnValue, StringVal, MK_STRING, FunctionValue } from "../values.ts";

function eval_numeric_binary_expr(lhs: NumberVal, rhs: NumberVal, operator: string): NumberVal {
    let result = 0;
    if (operator == "+") {
        result = lhs.value + rhs.value;
    } else if (operator == "-") {
        result = lhs.value - rhs.value;
    } else if (operator == "*") {
        result = lhs.value * rhs.value;
    } else if (operator == "/") {
        result = lhs.value / rhs.value;
    } else {
        result = lhs.value % rhs.value;
    }

    return MK_NUMBER(result);
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
	const args = expr.args.map((arg) => evaluate(arg, env));
	const fn = evaluate(expr.caller, env);

	if (fn.type === "native-fn") {
		const result = (fn as NativeFnValue).call(args, env);
	    return result;
	}
    
    if (fn.type === "function") {
        const func = fn as FunctionValue;
        const scope = new Environment(func.declarationEnv);

        // create the variables for the parameters
        for (let i = 0; i < func.parameters.length; i++) {
            // TODO: Check the bounds here.
            // verify arity of function
            const varname = func.parameters[i];
            scope.declareVar(varname, args[i], false, "dynamic");
        } 

        let result: RuntimeVal = MK_NULL();
        // Evaluate the statements or ^^^ if none it will be null.
        for (const stmt of func.body) {
            result = evaluate(stmt, scope);
        }

        return result;
    }

    throw `Cannot call value that is not a function, INTERNAL DATA: ` + JSON.stringify(fn)
}

export function eval_binary_expr(binop: BinaryExpr, env: Environment): RuntimeVal {

    const lhs = evaluate(binop.left, env);
    const rhs = evaluate(binop.right, env);

    if (lhs.type == "number" && rhs.type == "number") {
        return eval_numeric_binary_expr(lhs as NumberVal, rhs as NumberVal, binop.operator);
    } else if (lhs.type == "string" || rhs.type == "string") {
        return eval_string_binary_expr(lhs as StringVal, rhs as StringVal, binop.operator);
    }

    return MK_NULL(); 

}

function eval_string_binary_expr(lhs: StringVal, rhs: StringVal, operator: string): StringVal {
    let result = "";
    if (operator == "+") {
        result = lhs.value + rhs.value;
    } else {
        throw `You can only add strings together, not anything else.`
    }

    return MK_STRING(result);
}

export function eval_identifier(ident: Identifier, env: Environment): RuntimeVal {
    const val = env.lookupVar(ident.symbol);
    return val;
}

export function eval_assignment(node: AssignmentExpr, env: Environment): RuntimeVal {
    if (node.assigne.kind !== "Identifier")
        throw `You must assign a value to a identifier.`;
    
    const varname = (node.assigne as Identifier).symbol;
    return env.assignVar(varname, evaluate(node.value, env));
}

export function eval_object_expr(obj: ObjectLiteral, env: Environment): RuntimeVal {
    const object = { type: "object", properties: new Map() } as ObjectVal
    for (const { key, value } of obj.properties) {
        const runtimeVal = (value == undefined) ? env.lookupVar(key) : evaluate(value, env); 

        object.properties.set(key, runtimeVal);
    }

    return object;
}

export function eval_member_expr(expr: MemberExpr, env: Environment): RuntimeVal {
    const objectVal = evaluate(expr.object, env) as ObjectVal;

    // If the objectVal is not an ObjectVal type, we cannot access properties. Throw an error.
    if (objectVal.type !== "object") {
        throw `Cannot access properties of non-object type: ${JSON.stringify(objectVal)}`;
    }

    const propertyValue = getProperty(objectVal, expr.property, env);

    // If the property doesn't exist, return MK_NULL()
    if (propertyValue === undefined) {
        return MK_NULL();
    }

    return propertyValue;
}

function getProperty(objectVal: ObjectVal, propertyExpr: Expr, env: Environment): RuntimeVal | undefined {
    if (propertyExpr.kind === "Identifier") {
        const ident = propertyExpr as Identifier
        // For simple identifiers, get the property directly from the object's properties map.
        return objectVal.properties.get(ident.symbol);
    } else {
        // For computed property access, evaluate the propertyExpr first and then get the property.
        const propertyKey = evaluate(propertyExpr, env) as StringVal;
        if (propertyKey.type !== "string") {
            throw `Property key must be a string`;
        }
        return objectVal.properties.get(propertyKey.value);
    }
}