// let x = 45 + ( foo * bar )
// [ LetToken, IndentifierTk, EqualsToken, NumberToken ]



export enum TokenType {
    // Literal Types

    Number, // 1234
    Identifier, // let > > > x < < <
    String, // ""
    // Grouping * Operators
    Equals, // =
    Equals2, // ==
    Comment, // starts on # and ends on \n
    OpenParen, // (
    CloseParen, // )
    OpenBrace, // {
    CloseBrace, // }
    OpenBracket, // [
    CloseBracket, // ]
    Comma, // ,
    Colon, // :
    Dot, // .
    BinaryOperator, // + - / % *
    Semicolon, // ;
    Escape, // backslash (\)
    // TODO: ^^^ Make this work

    // Keywords
    Let,
    Static,
    Import,
    Int,
    Str,
    Declare,
    If,
    Else,
    Or,
    And,
    Export,


    EOF, // END OF FILE
}

const KEYWORDS: Record<string, TokenType> = {
    let: TokenType.Let,
    static: TokenType.Static,
    int: TokenType.Int,
    str: TokenType.Str,
    import: TokenType.Import,
    declare: TokenType.Declare,
    if: TokenType.If,
    else: TokenType.Else,
    or: TokenType.Or, // TODO: add this to if statement
    and: TokenType.And, // TODO: add this to if statement
    export: TokenType.Export // TODO: make this work
}

export interface Token {
    value: string,
    type: TokenType,
}

function token (value = "", type: TokenType): Token {
    return { value, type };
}

function isalpha (src: string) {
    return /[a-zA-Z0-9_]/.test(src);
}

function isskippable (str: string) {
    return str == " " || str == "\n" || str == "\t" || str == "\r";
}

function isint (str: string) {
    const c = str.charCodeAt(0);
    const bounds = ["0".charCodeAt(0), "9".charCodeAt(0)];
    return (c >= bounds[0] && c <= bounds[1]);
}

// deno-lint-ignore no-explicit-any
function isnewline(src: any) {
    if (src[0] === "\n") {
        return true;
    }

    return false;
}

export function tokenize (sourceCode: string): Token[] {
    const tokens = new Array<Token>();
    const src = sourceCode.split("");

    // Builds each token
    while (src.length > 0) {
        if (src[0] == "(") {
            tokens.push(token(src.shift(), TokenType.OpenParen));
        } else if (src[0] == ")") {
            tokens.push(token(src.shift(), TokenType.CloseParen));
        } else if (src[0] == "+" || src[0] == "-" || src[0] == "*" || src[0] == "/" || src[0] == "%") {
            tokens.push(token(src.shift(), TokenType.BinaryOperator));
        } else if (src[0] == "=") {
            const equals = src.shift();
            if (src[0] == "=") {
                src.shift()
                tokens.push(token("==", TokenType.Equals2))
            } else {
                tokens.push(token(equals, TokenType.Equals));
            }
        } else if (src[0] == ";") {
            tokens.push(token(src.shift(), TokenType.Semicolon));
        } else if (src[0] == "\\") {
            tokens.push(token(src.shift(), TokenType.Escape));
        } else if (src[0] == ":") {
            tokens.push(token(src.shift(), TokenType.Colon));
        } else if (src[0] == "{") {
            tokens.push(token(src.shift(), TokenType.OpenBrace));
        } else if (src[0] == "}") {
            tokens.push(token(src.shift(), TokenType.CloseBrace));
        } else if (src[0] == "[") {
            tokens.push(token(src.shift(), TokenType.OpenBracket));
        } else if (src[0] == "]") {
            tokens.push(token(src.shift(), TokenType.CloseBracket));
        } else if (src[0] == ",") {
            tokens.push(token(src.shift(), TokenType.Comma));
        } else if (src[0] == ".") {
            tokens.push(token(src.shift(), TokenType.Dot));
        } else {
            // Handle multicharacter tokens

            // Build string tokens

            if (src[0] == "\"" || src[0] == "'") {
                const quoteChar = src.shift(); // Get the opening quote character
                let str = "";
    
                while (src.length > 0 && src[0] != quoteChar) {
                    str += src.shift();
                }
    
                if (src[0] == quoteChar) {
                    src.shift(); // Skip the closing quote
                    tokens.push(token(str, TokenType.String));
                } else {
                    console.log("You seem to have typed a string which was not closed.");
                    Deno.exit(1);
                }
            } else if(isint(src[0])) {
                let num = "";
                while (src.length > 0 && isint(src[0])) {
                    num += src.shift();
                }

                tokens.push(token(num, TokenType.Number));
            } else if (isalpha(src[0])) {
                let ident = "";
                while (src.length > 0 && isalpha(src[0])) {
                    ident += src.shift();
                }

                // check for reserved keywords
                const reserved = KEYWORDS[ident];
                if (typeof reserved === "number") {
                    tokens.push(token(ident, reserved));
                } else {
                    tokens.push(token(ident, TokenType.Identifier));
                }
            } else if (src[0] == "#") {
                // go past the comment
                let comment = "";
                while (src.length > 0 && isnewline(src[0]) === false) {
                    comment += src.shift();
                }
            } else if (isskippable(src[0])) {
                src.shift(); // SKIP THE CURRENT CHARACTER
            } else {
                console.log("Unrecgonized character found in source: ", src[0]);
                Deno.exit(1);
            }

        }
    }

    tokens.push({type: TokenType.EOF, value: "EndOfFile"});
    return tokens;
}