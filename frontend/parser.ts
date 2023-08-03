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
                return this.parse_var_declaration();
            case TokenType.Import:
                return this.parse_import_declaration();
            default:
                return this.parse_expr();
        }
    }

    private parse_import_declaration(): Stmt {
    this.eat(); // eat the import token
    let builtInLibrary: boolean;
    const identifier: string = this.at().value;
    if (identifier == "fs" || identifier == "test") {
        builtInLibrary = true;
    } else {
        throw `This language only supports built in libraries for now.`
    }

    this.eat(); // eat past identifier

    return { kind: "ImportDeclaration", builtInLibrary, identifier } as ImportDeclaration;

    }

    private parse_var_declaration(): Stmt {
        const isStatic = this.eat().type == TokenType.Static;
        const identifier = this.expect(
            TokenType.Identifier, 
            "Expected identifier following let | static keywords"
            ).value;
        
        if (this.at().type == TokenType.Semicolon) {
            this.eat(); // expect semicolon
            if (isStatic) {
                throw `Must assign value to static expression, if you meant to do it like this, use 'let' instead.`
            }

            return { kind: "VarDeclaration", identifier, static: false  } as VarDeclaration;
        }

        this.expect(TokenType.Equals, "Expected value given for variable.");
        const declaration = { kind: "VarDeclaration", value: this.parse_expr(), identifier, static: isStatic } as VarDeclaration;
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
            return this.parse_additive_expr();
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
                return {} as Stmt;
        }
    }
}
