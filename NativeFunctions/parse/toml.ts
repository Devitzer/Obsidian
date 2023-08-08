import Environment from "../../runtime/environment.ts";
import { RuntimeVal, StringVal } from "../../runtime/values.ts";
import { convertToObject } from "../../helpers/objects.ts";
import { parse } from "https://deno.land/std@0.197.0/toml/parse.ts";

// deno-lint-ignore no-unused-vars
export default function toml(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `parse.toml takes in a .toml file, and the arguement was undefined.`
    } else if (args[0].type !== "string") {
        throw `parse.toml takes in a .toml file, and the one you gave was not a string!`
    } else if (!(args[0] as StringVal).value.endsWith(".toml")) {
        throw `parse.toml, takes in a .toml file, which you didn't give.`
    } else if (args[1] !== undefined) {
        throw `Expected only a .toml file.`
    }

    const toml = Deno.readTextFileSync((args[0] as StringVal).value);
    const result = parse(toml);
    const final = convertToObject(result);
    return final;
}