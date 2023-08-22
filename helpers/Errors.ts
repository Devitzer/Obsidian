import chalkin from "https://deno.land/x/chalkin@v0.1.3/mod.ts";

// I'm gonna implement this when I can, This does still need improving.
// I just don't like the way that the throw keyword works, specifically when it comes to new lines.
export default class ObsidianError {
    constructor() {

    }

    public Throw(err: string) {
        console.error(chalkin.red("Obsidian Error: ") + err);
        Deno.exit(1);
    }
    
    public Warn(warning: string) {
        console.warn(chalkin.yellow("Obsidian Warning: ") + warning);
    }
}