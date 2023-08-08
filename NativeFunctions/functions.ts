import Environment from "../runtime/environment.ts";
import { MK_NATIVE_FN, MK_OBJECT, RuntimeVal } from "../runtime/values.ts";

import Native from "./all.ts";

export default function createNativeFunctions(env: Environment) {
    const ioObj: Map<string, RuntimeVal> = new Map();
    ioObj.set("print", MK_NATIVE_FN(Native.io.print));
    ioObj.set("dir", MK_NATIVE_FN(Native.io.dir));
    ioObj.set("error", MK_NATIVE_FN(Native.io.error));
    const timeObj: Map<string, RuntimeVal> = new Map();
    timeObj.set("unix", MK_NATIVE_FN(Native.Date.unix))
    const sysObj: Map<string, RuntimeVal> = new Map();
    sysObj.set("exit", MK_NATIVE_FN(Native.sys.exit));
    sysObj.set("sleep", MK_NATIVE_FN(Native.sys.sleep));
    const parseObj: Map<string, RuntimeVal> = new Map();
    parseObj.set("json", MK_NATIVE_FN(Native.parse.json));
    parseObj.set("yaml", MK_NATIVE_FN(Native.parse.yaml));
    parseObj.set("toml", MK_NATIVE_FN(Native.parse.toml));
    
    // STDIO FUNCS
    env.declareVar("io", MK_OBJECT(ioObj), true);
    // DATE FUNCS
    env.declareVar("Date", MK_OBJECT(timeObj), true);
    // SYS FUNCS
    env.declareVar("sys", MK_OBJECT(sysObj), true);
    // PARSE FUNCS
    env.declareVar("parse", MK_OBJECT(parseObj), true);

}