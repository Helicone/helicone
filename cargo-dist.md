Just noting everything i did for installing cargo dist... 


```
cargo install --git https://github.com/astral-sh/cargo-dist cargo-dist
dist init 
```

To get docs: 

```
cargo install mdbook
cargo install mdbook-toc
cargo install mdbook-linkcheck

git clone git@github.com:astral-sh/cargo-dist.git
cd cargo-dist/book
mdbook serve --port 3001
```

Publishing a new release
```
git tag v0.1.0
git push --tags
```

For testing:

1. Add `pr-run-mode = "upload"` to the `dist-workspace.toml`
2. Push PR
3. Run `dist build` to build binaries locally
4. Run `dist plan` locally to see what will be done in CI
5. `cd ./target/distrib/` and run installers manually and then run binary
   installed by installer
