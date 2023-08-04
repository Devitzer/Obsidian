import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";

export async function run(filename: string) {
    const parser = new Parser();
    const env = createGlobalEnv();

    const input = await Deno.readTextFile(filename);
    const program = parser.produceAST(input);
    const result = evaluate(program, env);
    return result;
}

repl();

export function repl () {
    const parser = new Parser();
    const env = createGlobalEnv();

    console.log("\nCitrineScript Repl v0.1, Type 'DONE' when done.");
    let code = "";
    while (true) {

        const input = prompt("> ");
        if (input != "DONE") {
            code += input;
        } else {
            const program = parser.produceAST(code);
            const result = evaluate(program, env);
            // console.log(result); // for when needed
            Deno.exit(1)
        }
    }
}