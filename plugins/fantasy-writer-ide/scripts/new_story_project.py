#!/usr/bin/env python
from __future__ import annotations

import argparse
import re
from pathlib import Path


def slugify(value: str) -> str:
    normalized = value.strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized)
    normalized = normalized.strip("-")
    normalized = re.sub(r"-{2,}", "-", normalized)
    return normalized or "story"


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.replace("\r\n", "\n"), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a fantasy story project folder (outline, bible, characters, scenes)."
    )
    parser.add_argument("title", help="Story title (used for folder naming)")
    parser.add_argument(
        "--path",
        default="writing",
        help="Parent directory where the story folder is created (default: writing)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files (does not delete extra files)",
    )
    args = parser.parse_args()

    story_slug = slugify(args.title)
    root = (Path(args.path).expanduser().resolve() / story_slug)
    root.mkdir(parents=True, exist_ok=True)

    files: dict[str, str] = {
        "README.md": f"# {args.title}\n\n## One-line premise\n\n[TBD]\n\n## Status\n\n- Draft: not started\n- Outline: not started\n- Canon: evolving\n",
        "style-guide.md": (
            "# Style Guide\n\n"
            "## POV & tense\n- POV: [TBD]\n- Tense: [TBD]\n\n"
            "## Voice targets\n- Diction: [TBD]\n- Humor: [TBD]\n- Description density: [TBD]\n\n"
            "## Banned / avoid\n- [TBD]\n"
        ),
        "timeline.md": "# Timeline\n\n| Date | Event | Notes |\n|---|---|---|\n| TBD | TBD | |\n",
        "outline/outline.md": (
            "# Outline\n\n"
            "## Logline\n[TBD]\n\n"
            "## Core promise\n[TBD]\n\n"
            "## Act 1\n- [TBD]\n\n"
            "## Act 2\n- [TBD]\n\n"
            "## Act 3\n- [TBD]\n"
        ),
        "bible/world.md": (
            "# World Bible\n\n"
            "## Elevator pitch\n[TBD]\n\n"
            "## Geography\n[TBD]\n\n"
            "## Cultures & politics\n[TBD]\n\n"
            "## History (5 key beats)\n1. [TBD]\n"
        ),
        "bible/magic-system.md": (
            "# Magic System\n\n"
            "## Rules (what is possible)\n1. [TBD]\n\n"
            "## Costs (what it takes)\n1. [TBD]\n\n"
            "## Limits (what it can't do)\n1. [TBD]\n\n"
            "## Failure modes\n- [TBD]\n"
        ),
        "characters/README.md": "# Characters\n\nCreate one file per character: `first-last.md`.\n",
        "scenes/0001.md": (
            "# Scene 1\n\n"
            "## Scene intent\n- Goal:\n- Conflict:\n- Outcome:\n\n"
            "## Draft\n\n[TBD]\n"
        ),
    }

    for rel, content in files.items():
        target = root / rel
        if target.exists() and not args.force:
            continue
        write_text(target, content)

    print(str(root))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

