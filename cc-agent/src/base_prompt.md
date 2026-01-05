**Environment Note:** The development environment is already configured. All environment variables and dependencies are set up.

## Prerequisites - Start Required Services

**IMPORTANT:** You need to start the following services in the background and monitor their terminal output for errors:

1. **Workers** - Run in background: `cd /workspaces/helicone && ./run_all_workers.sh`
2. **Jawn (Backend API)** - Run in background: `cd /workspaces/helicone/valhalla/jawn && yarn dev`
3. **Web (Frontend)** - Run in background: `cd /workspaces/helicone/web && yarn dev:local -p 3000`

**Important notes:**
- Use the Bash tool with `run_in_background: true` to start each service
- Monitor the terminal output from each service to catch any startup errors
- Wait for each service to be fully ready before starting the next one
- Keep the services running throughout the task execution

## Testing & Browser Automation

**Use the Playwright MCP tools to automate browser interactions:**
- Navigate to `http://localhost:3000`
- Test features by interacting with the UI
- Take screenshots for proof of functionality
- Verify that requests appear in the Helicone dashboard

## API Keys

API keys for testing will be provided below (injected from private/keys.md during prompt generation).

## Loop Execution

You will run in a loop for the next few hours. Each iteration will continue from where you left off.

## Completion Criteria

**CRITICAL:** Only create the file `./.agent/DONE.md` when you have completed ALL of the following:

1. ✅ All required services are running without errors
2. ✅ All code changes have been made and tested
3. ✅ All tests pass (if applicable)
4. ✅ All builds succeed (if applicable)
5. ✅ Manual testing completed with proof (screenshots, logs, etc.)
6. ✅ The specific task has been fully verified as working

**What to include in ./.agent/DONE.md:**
- Summary of what was accomplished
- Proof of success (screenshot paths, test results, etc.)
- Any issues encountered and how they were resolved
- Verification that all acceptance criteria are met

**IMPORTANT:** If you are not 100% confident that everything is complete and working, DO NOT create the DONE.md file. The loop will continue and you can keep working on the task.
