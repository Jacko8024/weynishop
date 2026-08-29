#!/usr/bin/env python3
"""Run a command on the WeyniShop VPS as root via SSH (password auth).

Usage:
    set WEYNIVPS_PASS=...   (required — never hardcode credentials)
    python deploy/tools/vps_exec.py "command here"
    python deploy/tools/vps_exec.py --put local_path remote_path

Reads multi-line output and returns exit code of the remote command.
"""
import os
import sys

import paramiko

HOST = os.environ.get("WEYNIVPS_HOST", "169.58.219.232")
USER = os.environ.get("WEYNIVPS_USER", "root")
PASS = os.environ.get("WEYNIVPS_PASS")


def connect() -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        username=USER,
        password=PASS,
        timeout=20,
        allow_agent=False,
        look_for_keys=False,
    )
    return client


def run(client: paramiko.SSHClient, cmd: str) -> int:
    # Windows terminals default to cp1252 — force UTF-8 so remote output with
    # unicode (systemd status bullets etc.) doesn't crash the print below.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    rc = stdout.channel.recv_exit_status()
    if out:
        print(out, end="" if out.endswith("\n") else "\n")
    if err:
        print("--- STDERR ---", file=sys.stderr)
        print(err, end="" if err.endswith("\n") else "\n", file=sys.stderr)
    return rc


def put(client: paramiko.SSHClient, local: str, remote: str) -> int:
    sftp = client.open_sftp()
    try:
        sftp.put(local, remote)
        print(f"uploaded {local} -> {remote}")
        return 0
    finally:
        sftp.close()


def main() -> int:
    if len(sys.argv) < 2:
        print(
            "usage: vps_exec.py <command> | vps_exec.py --put <local> <remote>",
            file=sys.stderr,
        )
        return 2

    if not PASS:
        print(
            "WEYNIVPS_PASS env var is not set — refusing to run. "
            "Set it to the VPS root password first.",
            file=sys.stderr,
        )
        return 2

    try:
        client = connect()
    except Exception as exc:  # noqa: BLE001
        print(f"SSH CONNECT FAILED: {exc}", file=sys.stderr)
        return 1

    try:
        if sys.argv[1] == "--put":
            if len(sys.argv) < 4:
                print("usage: vps_exec.py --put <local> <remote>", file=sys.stderr)
                return 2
            return put(client, sys.argv[2], sys.argv[3])
        return run(client, sys.argv[1])
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
