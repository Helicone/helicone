Just noting everything i did for installing cargo dist... 


```
cargo install --git https://github.com/astral-sh/cargo-dist cargo-dist
cargo-dist init 
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
