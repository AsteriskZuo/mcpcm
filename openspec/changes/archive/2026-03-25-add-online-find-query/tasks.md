## 1. Find Online Mode Parsing

- [x] 1.1 Refactor `app/src/commands/find.ts` argument parsing to recognize strict online syntax `mcpcm find --online <keyword>`.
- [x] 1.2 Add explicit validation and user-facing guidance for invalid forms (`mcpcm find <keyword> --online`) and missing keyword (`mcpcm find --online`).
- [x] 1.3 Keep existing local-search path unchanged when `--online` is not provided.

## 2. Online Query Execution and Output

- [x] 2.1 Implement online query request path to call `GET /v1/query/mcp-servers?mcp_name=<keyword>` using configured backend base URL.
- [x] 2.2 Implement response handling rules: print array on `200`, print `status + error body` on non-`200`.
- [x] 2.3 Implement request exception handling to emit warning output without crashing the command.

## 3. Test Coverage

- [x] 3.1 Add/extend tests for strict syntax acceptance and rejection cases in find command behavior.
- [x] 3.2 Add tests for online mode success responses (`200` non-empty array and `200` empty array).
- [x] 3.3 Add tests for non-`200` responses and network exception warning behavior.

## 4. Documentation and Verification

- [x] 4.1 Update CLI help/README usage examples to include `mcpcm find --online <keyword>` and online-mode constraints.
- [x] 4.2 Run `npm test` and `npm run type-check` in `app/` after implementation to verify behavior.
