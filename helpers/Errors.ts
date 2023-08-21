import chalkin from "https://deno.land/x/chalkin@v0.1.3/mod.ts";

// I'm gonna implement this when I can, This does still need improving.
// I just don't like the way that the throw keyword works, specifically when it comes to new lines.
export default class ObsidianError {
    private error = "";
    constructor(error: string) {
        this.error = error;
    }

    public Throw() {
        console.error(chalkin.red("Obsidian Error: ") + this.error);
        Deno.exit(1);
    }
}