# PipeScore

## A modern bagpipe notation app

I started building this a while ago since I wasn't satisfied with other bagpipe notation apps that I found.

PipeScore's "killer feature" is reactive gracenotes - pipe embellishments that automatically update when you change the note that they are on. This means gracenotes can be added in sets (e.g. 'add a doubling to this note') rather than the user having to individually pick the correct one.

![GIF of reactive gracenote](dragging-gracenote.gif)

It is currently under development - see `todo.md` for a rough roadmap.

PipeScore is written in [TypeScript](https://www.typescriptlang.org/). It uses [firebase](https://firebase.google.com) for saving, user accounts, and hosting, via [firebase-auth-lite](https://github.com/samuelgozi/firebase-auth-lite) and [firebase-firestore-lite](https://github.com/samuelgozi/firebase-firestore-lite) for a smaller, faster experience.

Building is done with the amazing [esbuild](https://github.com/evanw/esbuild), linting with [eslint](https://eslint.org/), and circular dependency detection with [madge](https://github.com/pahen/madge). Code formatting is done with [prettier](https://prettier.io).

To learn more about how it works, have a look at the READMEs in `src/PipeScore` and `src/render`.

## Features

Piping features:

- Reactive embellishments
- Undo / redo
- Ties
- Triplets
- Repeats and Second timings
- Time signatures
- Text boxes
- Automatic note grouping
- Bars/Staves/e.t.c.

Programming features:

- ~5000 source lines of TypeScript
- Custom virtual DOM

## Running locally

All of the scripts in the `scripts` directory are designed to be run from the top level, like:

```zsh
$ ./scripts/linecount.zsh
```

You will need:

- `pandoc`
- `m4`
- `python3` (and `pip3`)
- `npm`
- `tsc`

To make things, run:

- `pip3 install svgwrite`
- `python3 scripts/make-icons.py`
- `python3 scripts/make-note-icons.py`
- `python3 scripts/make-gracenote-icons.py`
- `npm run build`

Run the following commands to run locally, ideally in separate terminals:

- `npm run dev` - to run the development server
- `npm run watch` - to rebuild JS on changes
- `tsc --watch` - to typecheck

To deploy:

- `npm run build` - to build minified bundle
- `npm run deploy` - to deploy to Firebase
