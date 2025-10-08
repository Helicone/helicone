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

edit the `src/task.md` file with the task you

# Claude code agent in a loop

The idea here is to run
