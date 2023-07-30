import Environment from "../../runtime/environment.ts";
import { RuntimeVal, NumberVal } from "../../runtime/values.ts";

// deno-lint-ignore no-unused-vars
export default function exit(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `sys.exit takes in an exit code, and you didn't give one!`
    } else if (args[0].type !== "number") {
        throw `sys.exit takes in an exit code, and the one you gave was not a number!`
    } else if (args[1] !== undefined) {
        throw `Expected only an exit code`
    }

    const exitCode = args[0] as NumberVal;
    return Deno.exit(exitCode.value);
}