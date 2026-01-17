from __future__ import annotations

import argparse
from pathlib import Path

from sqlmodel import Session

from app.db.session import engine
from app.services.skill_seed import SYSTEM_SKILL_EMAIL, load_presets, seed_market_skills


def main() -> None:
    parser = argparse.ArgumentParser(description='Seed market skills from a JSON file.')
    parser.add_argument(
        '--path',
        default=str(Path(__file__).resolve().parents[1] / 'skills' / 'market-presets.json'),
        help='Path to presets JSON file',
    )
    parser.add_argument(
        '--system-email',
        default=SYSTEM_SKILL_EMAIL,
        help='System user email for owning preset skills',
    )
    parser.add_argument('--dry-run', action='store_true', help='Validate only, do not write to DB')
    args = parser.parse_args()

    path = Path(args.path).expanduser()
    presets = load_presets(path)
    if args.dry_run:
        print(f"validated {len(presets)} preset skills")
        return

    with Session(engine) as session:
        summary = seed_market_skills(session, presets, system_email=args.system_email)
    print(
        f"seeded market skills: created={summary.created} updated={summary.updated} skipped={summary.skipped}"
    )


if __name__ == '__main__':
    main()
