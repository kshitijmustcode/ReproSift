"""Start the API after validating all configuration it currently consumes."""

import argparse
import sys
from pathlib import Path

import uvicorn
from pydantic import ValidationError

from reprosift.app import create_app
from reprosift.config import load_settings


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the ReproSift API")
    parser.add_argument("--env-file", type=Path, help="Explicit dotenv file to load")
    args = parser.parse_args()
    if args.env_file is not None and not args.env_file.is_file():
        parser.error("The requested env file does not exist or is not a file")
    try:
        settings = load_settings(args.env_file)
    except ValidationError as error:
        # Field names and error categories are sufficient; never log raw values.
        for issue in error.errors(include_input=False, include_context=False):
            field = ".".join(str(part) for part in issue["loc"])
            print(f"Invalid configuration: {field} ({issue['type']})", file=sys.stderr)
        raise SystemExit(2) from None
    except OSError:
        parser.error("The requested env file could not be read")

    uvicorn.run(
        create_app(settings),
        host=str(settings.api_host),
        port=settings.api_port,
        log_level=settings.log_level,
    )
