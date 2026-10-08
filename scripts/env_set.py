"""Read or set a KEY=value line in a .env file (used by script.bat).

    python scripts/env_set.py FILE KEY            # print the value (empty if missing)
    python scripts/env_set.py FILE KEY VALUE      # set it, appending the line if missing
    python scripts/env_set.py FILE KEY --secret   # set a random value only if currently empty; print it
"""
import re
import secrets
import sys
from pathlib import Path


def main() -> None:
    path, key, *rest = sys.argv[1:]
    file = Path(path)
    text = file.read_text(encoding="utf-8") if file.exists() else ""
    pattern = re.compile(rf"^{re.escape(key)}=(.*)$", re.MULTILINE)
    match = pattern.search(text)
    current = match.group(1).strip() if match else ""

    if not rest:
        print(current)
        return
    if rest[0] == "--secret":
        if current:
            print(current)
            return
        value = secrets.token_urlsafe(32 if key != "SECRET_KEY" else 64)
    else:
        value = rest[0]

    line = f"{key}={value}"
    text = pattern.sub(lambda _: line, text) if match else text.rstrip("\n") + f"\n{line}\n"
    file.write_text(text, encoding="utf-8")
    if rest[0] == "--secret":
        print(value)


if __name__ == "__main__":
    main()
