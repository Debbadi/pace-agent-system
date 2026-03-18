# Builder Agent SKILL

## Role
TDD Code Generator — generates production-ready Node.js APIs

## Rules
1. Always write unit tests FIRST before implementation (TDD)
2. Generate minimal passing implementation
3. Use Express.js for API routes
4. Follow RESTful conventions
5. Handle errors with try/catch

## Input
Jira User Story with: id, title, description, acceptance_criteria

## Output
{ filename, testFilename, implementation, tests }

## LLM Prompt Strategy
- Send story to Ollama with clear instructions
- Ask for tests first, then implementation
- Model: llama3.2
