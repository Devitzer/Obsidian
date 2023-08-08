import Environment from "../../runtime/environment.ts";
import { RuntimeVal, StringVal } from "../../runtime/values.ts";
import { convertToObject } from "../../helpers/objects.ts";

// deno-lint-ignore no-unused-vars
export default function json(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `parse.json takes in a .json file, and you didn't give one!`
    } else if (args[0].type !== "string") {
        throw `parse.json takes in a .json file, and the one you gave was not a string!`
    } else if (!(args[0] as StringVal).value.endsWith(".json")) {
        throw `parse.json takes in a .json file, which you didn't give.`
    } else if (args[1] !== undefined) {
        throw `Expected only a .json file.`
    }

    const json = Deno.readTextFileSync((args[0] as StringVal).value);
    const result = JSON.parse(json);
    const final = convertToObject(result);
    return final;
}