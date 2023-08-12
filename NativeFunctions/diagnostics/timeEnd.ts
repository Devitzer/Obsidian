import Environment from "../../runtime/environment.ts";
import { RuntimeVal, StringVal, MK_VOID } from "../../runtime/values.ts";

// deno-lint-ignore no-unused-vars
export default function timeEnd(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `diagnostics.timeEnd takes in a time label, and you didn't give one!`
    } else if (args[0].type !== "string") {
        throw `diagnostics.timeEnd takes in a time label, and the one you gave was not a string!`
    } else if (args[1] !== undefined) {
        throw `Expected only a time label.`
    }

    const arg0 = args[0] as StringVal
    console.timeEnd(arg0.value);
    return MK_VOID();
}