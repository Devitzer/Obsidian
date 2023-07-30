// deno-lint-ignore-file no-unused-vars
import Environment from "../../runtime/environment.ts";
import { RuntimeVal,MK_NUMBER } from "../../runtime/values.ts";

export default function unix(args: RuntimeVal[], scope: Environment) {
    return MK_NUMBER(Date.now());
}