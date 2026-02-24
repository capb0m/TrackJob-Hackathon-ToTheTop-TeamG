#!/usr/bin/env python3
"""
Claude Code PostToolUse フック
ファイル編集後、変更内容に応じて Docker Compose を自動更新する。

- package.json / Dockerfile / docker-compose.yml 等の変更 → docker compose up --build -d
- その他のソースファイル変更 → hot reload で自動反映（Docker 操作不要）
"""

import sys
import json
import subprocess
import os

# Claude Code が stdin に JSON でツール情報を渡す
try:
    data = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(0)

file_path = data.get("tool_input", {}).get("file_path", "")

# これらのファイルが変更された場合はイメージ再ビルドが必要
CRITICAL_PATTERNS = [
    "package.json",
    "Dockerfile",
    "docker-compose.yml",
    "bun.lockb",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "turbo.json",
]

needs_rebuild = any(pattern in file_path for pattern in CRITICAL_PATTERNS)

# カレントディレクトリ（git rev-parse でプロジェクトルートに cd 済みの前提）
project_root = os.getcwd()

if not needs_rebuild:
    basename = os.path.basename(file_path) if file_path else "(unknown)"
    print(f"[Docker Sync] {basename} を変更 → hot reload で自動反映（Docker 操作不要）")
    sys.exit(0)

print(f"[Docker Sync] 重要ファイルを変更: {file_path}")
print("[Docker Sync] docker compose up --build -d を実行中...")

result = subprocess.run(
    ["docker", "compose", "up", "--build", "-d"],
    cwd=project_root,
    text=True,
)

if result.returncode != 0:
    print("[Docker Sync] ❌ Docker の再ビルドに失敗しました")
    sys.exit(1)

print("[Docker Sync] ✅ コンテナを再ビルド・起動しました")
