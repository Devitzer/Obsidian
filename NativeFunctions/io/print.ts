import Environment from "../../runtime/environment.ts";
import { RuntimeVal, StringVal, NumberVal, BooleanVal, NullVal, MK_VOID } from "../../runtime/values.ts";

// deno-lint-ignore no-unused-vars
export default function print(args: RuntimeVal[], scope: Environment) {
    let final = "";
        for (const arg of args) {
            if (arg.type === "string") {
                const val = arg as StringVal;
                final += val.value
            } else if (arg.type === "number") {
                const val = arg as NumberVal;
                final += val.value
            } else if (arg.type === "boolean") {
                const val = arg as BooleanVal;
                final += val.value
            } else if (arg.type === "null") {
                const val = arg as NullVal;
                final += val.value
            } else {
                throw `You tried to print a unsupported type of item! You can only print: string | number | boolean | null, you gave a ${arg.type}.`
            }
        }
    console.log(final)
    return MK_VOID();
}