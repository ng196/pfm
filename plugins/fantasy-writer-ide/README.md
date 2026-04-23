# Fantasy Writer IDE (Codex Plugin)

This plugin adds writing-focused skills for fantasy drafting and revision.

## Recommended workflow

1) Create a story project folder:

`python plugins/fantasy-writer-ide/scripts/new_story_project.py "My Story" --path writing`

2) Use the plugin skills in Codex:

- Outline: `fantasy-writer-ide:story-architect`
- World bible: `fantasy-writer-ide:worldbuilding-bible`
- Characters: `fantasy-writer-ide:character-forge`
- Draft scenes: `fantasy-writer-ide:scene-drafter`
- Continuity pass: `fantasy-writer-ide:continuity-editor`
- Line edit: `fantasy-writer-ide:line-editor`

## Project structure created by the script

`writing/<story-slug>/`
- `README.md`
- `style-guide.md`
- `outline/`
- `bible/`
- `characters/`
- `scenes/`
- `timeline.md`

