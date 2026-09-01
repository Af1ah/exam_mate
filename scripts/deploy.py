#!/usr/bin/env python3
"""Create an immutable Docker Compose release on a remote host over SSH."""

from __future__ import annotations

import argparse
import datetime as dt
import pathlib
import shlex
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
    release = f"release-{dt.datetime.now(dt.UTC):%Y%m%dT%H%M%S%fZ}"
    ssh_opts = (
        "-o", "BatchMode=yes",
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
    )
    target = f"{args.user}@{args.host}"
    ssh = ("ssh", "-i", args.identity_file, *ssh_opts, target)

    with tempfile.TemporaryDirectory() as temp_dir:
        archive = pathlib.Path(temp_dir) / "exam-mate.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            for path in root.rglob("*"):
                relative = path.relative_to(root)
                if any(part in EXCLUDED_PARTS or part.startswith(".env") for part in relative.parts):
                    continue
                tar.add(path, arcname=relative)

        remote_archive = f"/tmp/exam-mate-{release}.tar.gz"
        run("scp", "-i", args.identity_file, *ssh_opts, str(archive), f"{target}:{remote_archive}")

    remote_release = f"{args.remote_dir}/releases/{release}"
    deploy_command = (
        f"test -f {shlex.quote(f'{args.remote_dir}/.env')}; "
        f"mkdir -p {shlex.quote(f'{args.remote_dir}/releases')} {shlex.quote(remote_release)}; "
        f"tar -xzf {shlex.quote(remote_archive)} -C {shlex.quote(remote_release)}; "
        f"rm -f {shlex.quote(remote_archive)}; "
        f"cp {shlex.quote(f'{args.remote_dir}/.env')} {shlex.quote(f'{remote_release}/.env')}; "
        f"cd {shlex.quote(remote_release)}; "
        "docker compose --project-name exam-mate up -d --build --remove-orphans"
    )
    remote = (
        "set -eu; "
        f"flock -w 600 {shlex.quote(f'{args.remote_dir}/.deploy.lock')} "
        f"sh -ceu {shlex.quote(deploy_command)}"
    )
    run(*ssh, remote)
    print(f"Deployed {release}")


if __name__ == "__main__":
    main()
