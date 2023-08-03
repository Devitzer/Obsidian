import Environment from "../../runtime/environment.ts";
import { MK_NULL, RuntimeVal, StringVal } from "../../runtime/values.ts";

// deno-lint-ignore no-unused-vars
export default function deleteFile(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `fs.deleteFile takes in a file name, and you didn't give one!`
    } else if (args[0].type !== "string") {
        throw `fs.deleteFile takes in a file, and the one you gave was not a string!`
    } else if (args[1] !== undefined) {
        throw `Expected only a file name.`
    }

    const theArg = args[0] as StringVal;
    Deno.removeSync(theArg.value);
    return MK_NULL();
}