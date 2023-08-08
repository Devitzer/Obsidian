import Environment from "../../runtime/environment.ts";
import { MK_VOID, NumberVal, RuntimeVal } from "../../runtime/values.ts";

function sleepHelper(ms: number) {
    const start = new Date().getTime();
    let currentTime = start;
  
    while (currentTime - start < ms) {
      currentTime = new Date().getTime();
    }
  }

// deno-lint-ignore no-unused-vars
export default function sleep(args: RuntimeVal[], scope: Environment) {
    if (args[0] === undefined) {
        throw `Expected number for how many ms sys.sleep should sleep for.`
    } else if (args[0].type !== "number") {
        throw `Expected a number for how many ms sys.sleep should sleep for. And it wasn't a number.`
    }

    const theArg = args[0] as NumberVal
    sleepHelper(theArg.value);
    return MK_VOID();
}