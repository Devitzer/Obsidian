import Environment from "../../runtime/environment.ts";
import { MK_NUMBER, NumberVal, RuntimeVal } from "../../runtime/values.ts";


// deno-lint-ignore no-unused-vars
export default function round(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `Expected a number arguement for Math.floor.`;
    } else if (args[0].type !== "number") {
        throw `Expected a number value for Math.floor. And the type given was: ${args[0].type}`;
    } else if (args[1] !== undefined) {
        throw `Expected only one arguement for Math.floor, not more.`;
    }

    const theArg = args[0] as NumberVal

    return MK_NUMBER(Math.floor(theArg.value));
}