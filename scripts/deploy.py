#!/usr/bin/env python3
"""Create an immutable Docker Compose release on a remote host over SSH."""

from __future__ import annotations

import argparse
import datetime as dt
import pathlib
import subprocess
import tarfile
import tempfile


EXCLUDED_PARTS = {".git", ".next", "node_modules", ".env", "coverage", "dist"}


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", required=True)
    parser.add_argument("--user", default="root")
    parser.add_argument("--identity-file", required=True)
    parser.add_argument("--remote-dir", default="/root/projects/exam-mate")
    args = parser.parse_args()

    root = pathlib.Path(__file__).resolve().parents[1]
    release = f"release-{dt.datetime.now(dt.UTC):%Y%m%dT%H%M%SZ}"
    target = f"{args.user}@{args.host}"
    ssh = ("ssh", "-i", args.identity_file, "-o", "BatchMode=yes", target)

    with tempfile.TemporaryDirectory() as temp_dir:
        archive = pathlib.Path(temp_dir) / "exam-mate.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            for path in root.rglob("*"):
                relative = path.relative_to(root)
                if any(part in EXCLUDED_PARTS or part.startswith(".env") for part in relative.parts):
                    continue
                tar.add(path, arcname=relative)

        run("scp", "-i", args.identity_file, "-o", "BatchMode=yes", str(archive), f"{target}:/tmp/exam-mate.tar.gz")

    remote_release = f"{args.remote_dir}/releases/{release}"
    remote = (
        "set -eu; "
        f"test -f {args.remote_dir}/.env; "
        f"mkdir -p {args.remote_dir}/releases {remote_release}; "
        f"tar -xzf /tmp/exam-mate.tar.gz -C {remote_release}; "
        f"cp {args.remote_dir}/.env {remote_release}/.env; "
        f"cd {remote_release}; docker compose up -d --build --remove-orphans"
    )
    run(*ssh, remote)
    print(f"Deployed {release}")


if __name__ == "__main__":
    main()
