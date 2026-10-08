"""Seed command.

    python -m app.seed           # create tables and seed only if the database is empty
    python -m app.seed --reset   # drop all tables, recreate, and reseed
"""

import argparse

from app.bootstrap import create_tables, reset_database, seed_if_empty


def main() -> None:
    parser = argparse.ArgumentParser(description="Create tables and load seed data.")
    parser.add_argument("--reset", action="store_true", help="drop and recreate all tables first")
    args = parser.parse_args()

    if args.reset:
        reset_database()
        print("Dropped and recreated all tables.")
    else:
        create_tables()

    if seed_if_empty():
        print("Seed data loaded.")
    else:
        print("Database already has listings; nothing loaded. Use --reset to reseed.")


if __name__ == "__main__":
    main()
