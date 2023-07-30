import Environment from "../../runtime/environment.ts";
import { RuntimeVal, StringVal } from "../../runtime/values.ts";

// deno-lint-ignore no-unused-vars
export default function readFile(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `fs.readFile takes in a file name, and you didn't give one!`
    } else if (args[0].type !== "string") {
        throw `fs.readFile takes in a file, and the one you gave was not a string!`
    } else if (args[1] !== undefined) {
        throw `Expected only a file name.`
    }

    const theArg = args[0] as StringVal;
    const file = Deno.readTextFileSync(theArg.value);

    return { type: "string", value: file } as StringVal;
}