import Parser from "./frontend/parser.ts";
import { createGlobalEnv } from "./runtime/environment.ts";
import { evaluate } from "./runtime/interpreter.ts";
import { tokenize } from "./frontend/lexer.ts";

run("tests.ces");

async function run(filename: string) {
    const parser = new Parser();
    const env = createGlobalEnv();

    const input = await Deno.readTextFile(filename);
    const lexer = tokenize(input)
    const program = parser.produceAST(input);

    const result = evaluate(program, env);
    console.log("LEXER: \n\n");
    console.log(lexer);
    console.log("\n\nPARSER: \n\n");
    console.log(program);
    console.log("\n\nRESULT: \n\n");
    console.log(result);
    // for when i need it
}