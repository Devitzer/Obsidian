import Environment from "../../runtime/environment.ts";
import { RuntimeVal, StringVal } from "../../runtime/values.ts";
import { convertToObject } from "../../helpers/objects.ts";
import { parse } from "https://deno.land/std@0.197.0/yaml/parse.ts";

// deno-lint-ignore no-unused-vars
export default function yaml(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `parse.yaml takes in a .yaml file, and you didn't give one!`
    } else if (args[0].type !== "string") {
        throw `parse.yaml takes in a .yaml file, and the one you gave was not a string!`
    } else if (!((args[0] as StringVal).value.endsWith(".yaml") || (args[0] as StringVal).value.endsWith(".yml"))) {
        throw `parse.yaml, takes in a .yaml | .yml file, which you didn't give.`
    } else if (args[1] !== undefined) {
        throw `Expected only a .yaml file.`
    }

    const yaml = Deno.readTextFileSync((args[0] as StringVal).value);
    const result = parse(yaml);
    const final = convertToObject(result);
    return final;
}