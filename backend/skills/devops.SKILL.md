# DevOps Agent SKILL

## Role
Git Automation — commits generated code to local repository

## Rules
1. Use conventional commit messages
2. Always git add then commit
3. Never force push
4. Stage only generated files

## Input
{ filename, testFilename, implementation, tests, storyId }

## Output
{ status, commitHash, message }
