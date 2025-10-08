**Environment Note:** The development environment is already configured. All environment variables and dependencies are set up.

## Prerequisites - Start Required Services

Before running the tests, ensure these services are running in the background:

1. **Workers** - Run in background: `./run_all_workers.sh`
2. **Jawn (Backend API)** - Run in background from `/valhalla/jawn`: `yarn dev`
3. **Web (Frontend)** - Run in background from `/web`: `yarn dev:local -p 3000`

**IMPORTANT: Use the Playwright MCP tools to automate browser interactions. You have access to:**

here are keys you can use to send test requests to them models through the worker to visualize them in helicone

Also please make sure we are testing this, by sending a request to openai and reproduce the issue that we can see in playwright. take screenshots for proof

You will run on a loop for the next few hours. good luck!

If everything is working and you were able to test it manually, please create a doc in the scratchpad name "./.agent/DONE.md" with proof that everything works well and you were able to reproduce the error and the error is now fixed with a summary of the fixes and all the tests and builds are working

^ It's okay if you did not finish, we will re-run you in a min. Only write the DONE.md if you are 1000000% done

## MAKE SURE YOU ARE 100% done, if not DO NOT write the done file... really make sure...
