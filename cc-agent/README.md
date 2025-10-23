This is an internal tool to autonomously run agents in a loop in github codespaces.

# Context

Github codespaces are an amazing product and we build codespaces periodically with the latest Helicone changes (see ../.devcontainer/\*) for more information on how these codespaces are generated.

_The idea_ is to spawn isolated github codespaces that can be easily used for agent loops, where they can run `--dangerously-skip-permissions`.

Github codespaces is an amazing tool because they have a CLI perfect for managing your environments and are preconfigured with git creds to allow you to push changes.

```bash
gh cs --help
Connect to and manage codespaces

USAGE
  gh codespace [flags]

ALIASES
  cs

AVAILABLE COMMANDS
  code:        Open a codespace in Visual Studio Code
  cp:          Copy files between local and remote file systems
  create:      Create a codespace
  delete:      Delete codespaces
  edit:        Edit a codespace
  jupyter:     Open a codespace in JupyterLab
  list:        List codespaces
  logs:        Access codespace logs
  ports:       List ports in a codespace
  rebuild:     Rebuild a codespace
  ssh:         SSH into a codespace
  stop:        Stop a running codespace
  view:        View details about a codespace

INHERITED FLAGS
  --help   Show help for command

LEARN MORE
  Use `gh <command> <subcommand> --help` for more information about a command.
  Read the manual at https://cli.github.com/manual
```

# Getting started

```bash
# run the below gh cs create
> gh cs create
? Repository: Helicone/helicone
  ✓ Codespaces usage for this repository is paid for by chitalian
? Branch (leave blank for default branch):
? Choose Machine Type: 4 cores, 16 GB RAM, 32 GB storage (Prebuild ready)
```

connect to it and open vscode with..

```bash
gh cs code
# or ssh instead if that's more your thing
gh cs ssh
```

Note this will run the build script which may take up to 5 minutes... be patient

# How to Use

## Setup (First Time Only)

1. **Set up API keys:**
   ```bash
   cp private/keys.md.template private/keys.md
   # Edit private/keys.md and add your API keys
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x run.sh generate-prompt.sh
   ```

## Usage

1. **Edit the task:**
   Edit `src/task.md` with the task you want the agent to accomplish. See `src/task-template.md` for examples.

2. **Run the agent loop:**
   ```bash
   ./run.sh
   ```

3. **Monitor progress:**
   - The agent will run in iterations, continuing from where it left off
   - Watch the terminal output for progress
   - The agent will start services and monitor their output

4. **Completion:**
   - The loop will exit when the agent creates `.agent/DONE.md`
   - This file will contain proof of completion and a summary

## How It Works

The agent loop works by:

1. **Generating a prompt** - Combines `src/base_prompt.md` + `src/task.md` + `private/keys.md` into `prompt.md`
2. **Running Claude Code** - Executes Claude Code with `--dangerously-skip-permissions` in a loop
3. **Continuing iterations** - Each iteration uses `--continue` to build on previous work
4. **Monitoring completion** - Checks for `.agent/DONE.md` to know when to stop

## File Structure

```
cc-agent/
├── run.sh                    # Main script to run the agent loop
├── generate-prompt.sh        # Generates prompt.md from source files
├── prompt.md                 # Generated prompt (gitignored)
├── .agent/                   # Runtime directory (gitignored)
│   └── DONE.md              # Created by agent when task is complete
├── src/
│   ├── base_prompt.md       # Base instructions for all tasks
│   ├── task.md              # Specific task to accomplish
│   └── task-template.md     # Template for creating new tasks
└── private/                  # Gitignored directory
    ├── keys.md.template     # Template for API keys
    └── keys.md              # Your actual API keys (not committed)
```

## Customizing Tasks

Edit `src/task.md` with your specific task. Good task descriptions include:

- **Clear objective** - What needs to be accomplished
- **Specific steps** - How to approach the task
- **Acceptance criteria** - What defines success
- **Expected outcome** - What the result should look like

See `src/task-template.md` for examples of different task types.

## Monitoring & Control

### Viewing Generated Prompt
```bash
./generate-prompt.sh --preview
```

### Stopping the Loop
Press `Ctrl+C` to gracefully stop the agent loop.

### Resuming After Stop
Simply run `./run.sh` again - the agent will continue from where it left off using the `--continue` flag.

### Checking Agent Output
The agent's work is preserved between runs. Check:
- Terminal output for real-time progress
- `.agent/` directory for completion status
- Git changes for code modifications

## Troubleshooting

### Issue: "prompt.md not found"
**Solution:** Run `./generate-prompt.sh` manually to debug prompt generation.

### Issue: Scripts not executable
**Solution:** Run `chmod +x run.sh generate-prompt.sh`

### Issue: API keys not working
**Solution:** Check that `private/keys.md` exists and has valid keys.

### Issue: Services won't start
**Solution:** Make sure you're in a GitHub Codespace with the dev environment set up.

### Issue: Agent keeps running but not making progress
**Solution:**
- Check the terminal output for errors
- Review what the agent is doing
- You may need to update `src/task.md` with more specific instructions
- Stop with Ctrl+C and restart

## Team Collaboration

### For Team Members
1. Clone/pull latest code
2. Create your own `private/keys.md` from the template
3. Customize `src/task.md` for your specific task
4. Run `./run.sh`

### Best Practices
- Keep tasks focused and specific
- Include clear acceptance criteria
- Document expected outcomes
- Share successful task patterns with the team

## Why GitHub Codespaces?

GitHub Codespaces is perfect for this use case because:

- **Pre-configured environments** - All dependencies and tools are ready
- **Isolated execution** - Safe to run with `--dangerously-skip-permissions`
- **Git credentials** - Pre-configured for commits and PRs
- **Easy management** - Use `gh cs` CLI to manage codespaces
- **Team sharing** - Easy to set up identical environments for the whole team

## Advanced Usage

### Adjusting Sleep Time
Edit `SLEEP_TIME_SECONDS` in `run.sh` to add delays between iterations:
```bash
SLEEP_TIME_SECONDS=60  # Wait 1 minute between iterations
```

### Custom Prompt Structure
You can modify `generate-prompt.sh` to change how the prompt is assembled or add additional source files.

### Running Multiple Agents
Create multiple codespaces and run different tasks in parallel. Each codespace is isolated.
