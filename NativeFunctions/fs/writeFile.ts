import Environment from "../../runtime/environment.ts";
import { MK_NULL, RuntimeVal, StringVal } from "../../runtime/values.ts";

// deno-lint-ignore no-unused-vars
export default function writeFile(args: RuntimeVal[], scope: Environment) {
    let fileArg: StringVal;
    let newValueArg: StringVal;

    if (args[0] == undefined) {
        throw `Expected a file to write to.`
    } else if (args[1] == undefined) {
        throw `Expected a new value to give to the file.`
    } else if (args[0].type !== "string") {
        throw `Expected file given to be a string.`
    } else if (args[1].type !== "string") {
        throw `Expected new value given to be a string, If you need to add numbers, you can just put it in a string.`
    } else {
        fileArg = args[0] as StringVal;
        newValueArg = args[1] as StringVal;

        Deno.writeTextFileSync(fileArg.value, newValueArg.value);
        return MK_NULL();
    }


}