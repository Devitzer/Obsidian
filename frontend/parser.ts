// deno-lint-ignore-file no-explicit-any
import { 
    Stmt, 
    Program, 
    Expr, 
    BinaryExpr, 
    NumericLiteral, 
    Identifier,
    VarDeclaration,
    AssignmentExpr,
    Property,
    ObjectLiteral,
    StringLiteral,
    CallExpr,
    MemberExpr,
    ImportDeclaration,
    FunctionDeclaration, 
    StaticTypes,
    IfDeclaration,
    BlockStatement,
ExportDeclaration,
} from "./ast.ts";
import { tokenize, Token, TokenType } from "./lexer.ts";

export default class Parser {
    private tokens: Token[] = [];

    private not_eof (): boolean {
        return this.tokens[0].type != TokenType.EOF;
    }

    private at () {
        return this.tokens[0] as Token;
    }

    private eat () {
        const prev = this.tokens.shift() as Token;
        return prev;
    }

    private expect (type: TokenType, err: any) {
        const prev = this.tokens.shift() as Token;
        if (!prev || prev.type != type) {
            console.error("Parser Error:\n", err, prev, "Expecting: ", type);
            Deno.exit(1);
        }

        return prev;
    }

    public produceAST (sourceCode: string): Program {
        this.tokens = tokenize(sourceCode);
        const program: Program = {
            kind: "Program",
            body: []
        }

        // Parse until end of file
        while (this.not_eof()) {
            program.body.push(this.parse_stmt());
        }

        return program;
    }

    private parse_stmt (): Stmt {
        // skip to parse_expr
        switch (this.at().type) {
            case TokenType.Let:
            case TokenType.Static:
            case TokenType.Int:
            case TokenType.Str:
            case TokenType.Obj:
            case TokenType.Bool:
                return this.parse_var_declaration();
            case TokenType.Import:
                return this.parse_import_declaration();
            case TokenType.Declare:
                return this.parse_declare();
            case TokenType.If:
                return this.parse_if_stmt();
            case TokenType.Export:
                return this.parse_export_declaration();
            default:
                return this.parse_expr();
        }
    }

    private parse_declare(): Stmt {
        this.eat(); // eat past the declare keyword
        const name = this.expect(TokenType.Identifier, "Expected identifier following the declare keyword.").value;
        const args = this.parse_args();
        const params: string[] = [];

        for (const arg of args) {
            if (arg.kind !== "Identifier") {
                console.log(arg);
                throw `^^^^ You cannot give a parameter to a function declaration which is not an identifier!`
            }

            params.push((arg as Identifier).symbol);
        }

        this.expect(TokenType.OpenBrace, "Expected opening brace >> { << following a function declaration.");
        const body: Stmt[] = [];

        while (this.at().type !== TokenType.CloseBrace && this.at().type !== TokenType.EOF) {
            body.push(this.parse_stmt());
        }

        this.expect(TokenType.CloseBrace, "Expected closing brace >> } << for a function body.");
        const declare = {
            kind: "FunctionDeclaration",
            body,
            name,
            parameters: params
        } as FunctionDeclaration;

        return declare;
    }

    private parse_if_stmt(): Stmt {
        this.eat(); // eat past the if keyword
        const test: Expr[] = [];

        while (this.at().type !== TokenType.OpenBrace && this.at().type !== TokenType.EOF) {
            test.push(this.parse_expr());
        }

        this.expect(TokenType.OpenBrace, "Expected opening brace >> { << after an if test.");
        
        const body = {
            kind: "BlockStatement",
            body: []
        } as BlockStatement

        while (this.at().type !== TokenType.CloseBrace && this.at().type !== TokenType.EOF) {
            body.body.push(this.parse_stmt());
        }

        const declare = {
            kind: "IfDeclaration",
            test,
            body,
        } as IfDeclaration

        this.expect(TokenType.CloseBrace, "Expected closing brace for an if keyword's body.");
        if (this.at().type == TokenType.Else) {
            this.eat(); // eat the else keyword
            if (this.at().type == TokenType.If) {
                declare.alternate = this.parse_if_stmt() as IfDeclaration;
                return declare;
            } else if (this.at().type == TokenType.OpenBrace) {
                this.eat(); // eat the open brace
                const body: BlockStatement = { kind: "BlockStatement", body: [] }
                while (this.at().type !== TokenType.CloseBrace && this.at().type !== TokenType.EOF) {
                    body.body.push(this.parse_stmt());
                }

                this.expect(TokenType.CloseBrace, "Expected closing brace for an else/else if keyword's body.");
                declare.alternate = body;
            } else {
                throw `Expected "if" keyword or opening bracket >> { << after else.`
            }
        }

        return declare;
    }

    private parse_import_declaration(): Stmt {
    this.eat(); // eat the import token
    let builtInLibrary: boolean;
    const identifier: string = this.at().value;
    if (identifier == "fs") {
        builtInLibrary = true;
    } else if (identifier == "diagnostics") {
        builtInLibrary = true;
    } else {
        builtInLibrary = false
    }

    this.eat(); // eat past identifier

    return { kind: "ImportDeclaration", builtInLibrary, identifier } as ImportDeclaration;

    }

    private parse_export_declaration(): Stmt {
        this.eat(); // eat the export token
        let value: FunctionDeclaration | Identifier[];

        if (this.at().type === TokenType.OpenBrace) {
            this.eat(); // eat open brace
            value = this.parse_export_identarr();
        } else if (this.at().type === TokenType.Declare) {
            value = this.parse_declare() as FunctionDeclaration;
        } else {
            throw `After export keyword, you must give a function declaration or an identifier array, like { myFuncion, myOtherFunction }`;
        }

        return {
            kind: "ExportDeclaration",
            specifiers: value
        } as ExportDeclaration
    }

    private parse_export_identarr(): Identifier[] {
        const identarr: Identifier[] = [];
        while (this.at().type !== TokenType.CloseBrace) {
            if (this.at().type === TokenType.Identifier) {
                identarr.push(this.parse_expr() as Identifier);
                const test = this.at();
                if (test.type !== TokenType.Comma && test.type !== TokenType.CloseBrace) {
                    throw `Expected comma or closing brace following identifier`
                }
                if (test.type === TokenType.Comma) {
                    this.eat(); // eat past the comma
                }
            } else {
                throw `Expected identifiers inside export array.`
            }
        }
        this.expect(TokenType.CloseBrace, "Expected closing brace after export declaration, got EOF");

        return identarr;
    }

    private parse_var_declaration(): Stmt {
        let type: StaticTypes;
        if (this.at().type == TokenType.Let || this.at().type == TokenType.Static) {
            type = "dynamic";
        } else if (this.at().type == TokenType.Int) {
            type = "int";
        } else if (this.at().type == TokenType.Str) {
            type = "str";
        } else if (this.at().type == TokenType.Bool) {
            type = "bool";
        } else if (this.at().type == TokenType.Obj) {
            type = "obj";
        } else {
            throw `Couldn't find the type of your declared variable, somehow. Please report this in GitHub Issues with your source code.`
        }
        const isStatic = this.eat().type == TokenType.Static;
        const identifier = this.expect(
            TokenType.Identifier, 
            "Expected identifier following variable declaration keywords"
            ).value;
        
        if (this.at().type !== TokenType.Equals) {
            this.eat(); // expect semicolon
            if (isStatic) {
                throw `Must assign value to static expression, if you meant to do it like this, use the other variable keywords instead.`
            }

            return { kind: "VarDeclaration", identifier, static: false, type  } as VarDeclaration;
        }

        this.expect(TokenType.Equals, "Expected value given for variable.");
        const value = this.parse_expr();
        const str = value as StringLiteral;
        const int = value as NumericLiteral;
        const obj = value as ObjectLiteral;
        const bool = value as Identifier;
        let finalChoice: Expr;

        if (type !== "dynamic") {
            if (type === "int" && value.kind !== "NumericLiteral") {
                throw `You gave an "int" variable, and the value was NaN.`;
            } else if (type === "str" && value.kind !== "StringLiteral") {
                throw `You gave a "str" variable, and the value was not a string.`;
            } else if (type === "obj" && value.kind !== "ObjectLiteral") {
                throw `You gave an "obj" variable, and the value was not an object.`;
            } else if (type === "bool" && value.kind !== "Identifier") {
                throw `The bool value you gave was not an Identifier! If you're confused, true/false counts as an Identifier until evaluated. But we do validate whether the identifier is true/false.`
            } else if (bool.symbol !== "true" && bool.symbol !== "false" && bool.symbol !== undefined) {
                throw `You gave a "bool" keyword and the value was not true/false`;
            }
        }

        if (type === "int") {
            finalChoice = int;
        } else if (type === "str") {
            finalChoice = str
        } else if (type === "bool") {
            finalChoice = bool;
        } else if (type === "obj") {
            finalChoice = obj;
        } else {
            finalChoice = value;
        }

        const declaration = { kind: "VarDeclaration", value: finalChoice, identifier, static: isStatic, type } as VarDeclaration;
        return declaration;
    }

    private parse_expr(): Expr {
        return this.parse_assignment_expr();
    }

    private parse_assignment_expr(): Expr {
        const left = this.parse_object_expr();

        if (this.at().type == TokenType.Equals) {
            this.eat(); // go past the equal token
            const value = this.parse_assignment_expr();
            return { value, assigne: left, kind: "AssignmentExpr" } as AssignmentExpr
        }

        return left;
    }

    private parse_object_expr(): Expr {
        if (this.at().type !== TokenType.OpenBrace) {
            return this.parse_conditions_expr();
        }

        this.eat(); // eat open brace
        const properties = new Array<Property>();

        while (this.not_eof() && this.at().type !== TokenType.CloseBrace) {
            const key = this.expect(TokenType.Identifier, "A key must be an Identifier, Example: { identifier: 123 }").value

            if (this.at().type == TokenType.Comma) {
                this.eat(); // eat the comma
                properties.push({ key, kind: "Property" } as Property);
                continue;
            } else if (this.at().type == TokenType.CloseBrace) {
                properties.push({ key, kind: "Property" });
                continue;
            }

            this.expect(TokenType.Colon, "Expected colon after the key inside an Object.");
            const value = this.parse_expr();

            properties.push({ kind: "Property", value, key })
            if (this.at().type != TokenType.CloseBrace) {
                this.expect(TokenType.Comma, "We expected a comma or closing brace for this Object.");
            }
        }

        this.expect(TokenType.CloseBrace, "An object requires a closing brace: '}'.");
        return { kind: "ObjectLiteral", properties } as ObjectLiteral
    }

    private parse_conditions_expr(): Expr {
        let left = this.parse_additive_expr();

        while (this.at().type === TokenType.Equals2) {
            const operator = this.eat().value;

            const right = this.parse_additive_expr();
            left = {
                kind: "BinaryExpr",
                left,
                right,
                operator,
                
            } as BinaryExpr;
        }

        return left;
    }

    private parse_additive_expr (): Expr {
        let left = this.parse_multiplicative_expr();



        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.eat().value;
            const right = this.parse_multiplicative_expr();
            left = {
                kind: "BinaryExpr",
                left, 
                right, 
                operator,
            } as BinaryExpr
        }

        
        return left;
    }

    private parse_multiplicative_expr (): Expr {
        let left = this.parse_call_member_expr()



        while (
            this.at().value == "/" || this.at().value == "*" || this.at().value == "%"
            ) {
            const operator = this.eat().value;
            const right = this.parse_call_member_expr()
            left = {
                kind: "BinaryExpr",
                left, 
                right, 
                operator,
            } as BinaryExpr
        }

        
        return left;
    }

    private parse_call_member_expr(): Expr {
        const member = this.parse_member_expr();
    
        if (this.at().type == TokenType.OpenParen) {
          return this.parse_call_expr(member);
        }
    
        return member;
      }
    
      private parse_call_expr(caller: Expr): Expr {
        let call_expr: Expr = {
          kind: "CallExpr",
          caller,
          args: this.parse_args(),
        } as CallExpr;
    
        if (this.at().type == TokenType.OpenParen) {
          call_expr = this.parse_call_expr(call_expr);
        }
    
        return call_expr;
      }
    
      private parse_args(): Expr[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis");
        const args = this.at().type == TokenType.CloseParen
          ? []
          : this.parse_arguments_list();
    
        this.expect(
          TokenType.CloseParen,
          "Missing closing parenthesis inside arguments list",
        );
        return args;
      }
    
      private parse_arguments_list(): Expr[] {
        const args = [this.parse_assignment_expr()];
    
        while (this.at().type == TokenType.Comma && this.eat()) {
          args.push(this.parse_assignment_expr());
        }
    
        return args;
      }
    
      private parse_member_expr(): Expr {
        let object = this.parse_primary_expr();
    
        while (
          this.at().type == TokenType.Dot || this.at().type == TokenType.OpenBracket
        ) {
          const operator = this.eat();
          let property: Expr;
          let computed: boolean;
    
          // non-computed values aka obj.expr
          if (operator.type == TokenType.Dot) {
            computed = false;
            // get identifier
            property = this.parse_primary_expr();
            if (property.kind != "Identifier") {
              throw `Cannonot use dot operator without right hand side being a identifier`;
            }
          } else { // this allows obj[computedValue]
            computed = true;
            property = this.parse_expr();
            this.expect(
              TokenType.CloseBracket,
              "Missing closing bracket in computed value.",
            );
          }
    
          object = {
            kind: "MemberExpr",
            object,
            property,
            computed,
          } as MemberExpr;
        }
    
        return object;
      }

    private parse_primary_expr (): Expr {
        const tk = this.at().type;

        switch (tk) {
            case TokenType.Identifier:
                return { kind: "Identifier", symbol: this.eat().value } as Identifier;
            case TokenType.Number:
                return { 
                    kind: "NumericLiteral", 
                    value: parseFloat(this.eat().value) 
                } as NumericLiteral;
            case TokenType.String:
                return { kind: "StringLiteral", value: this.eat().value } as StringLiteral;
            case TokenType.OpenParen: {
                this.eat(); // eat the opening paren
                const value = this.parse_expr();
                this.expect(
                    TokenType.CloseParen,
                    "Unexpected token found inside parenthesised expression. Expecting closing parenthesis.",
                ); // eat the closing paren
                return value;
            }

            default: 
                console.error("Unexpected token found during parsing: ", this.at());
                Deno.exit(1);
                // Trick the compiler for TS
                return {} as Stmt
        }
    }
}
