# LifeBalance

家計管理 × 将来設計ダッシュボード。
「家計簿を付ける時間がない」「続かない」「将来設計につながらない」を解決することを目的に、ダッシュボードとLINE連携で支出管理〜将来シミュレーションまでを一体化します。

---

## 主な機能

- **チャット式セットアップ**
  - 予算・目標・ライフプランを対話形式で設定（Phaseによりルールベース→AI化）
- **月次予算管理**
  - カテゴリ別に予算上限を設定・管理
- **支出登録**
  - ダッシュボードから入力
  - LINE（将来的にDiscordはオプション）からテキスト/画像で登録
- **AIアドバイス**
  - 支出履歴・予算消化率・目標進捗を踏まえた改善提案（Gemini）
- **将来設計シミュレーション**
  - モンテカルロ法による目標達成確率と資産推移の可視化
- **外部連携（Phase 4）**
  - LINE経由で支出登録・サマリー確認

---

## 技術スタック

### フロントエンド
- Next.js 15（App Router）
- TypeScript
- Tailwind CSS v4 / shadcn/ui
- Recharts
- React Hook Form + Zod
- Zustand（グローバル） + TanStack Query（サーバー状態）

### バックエンド
- Hono（Bun）
- TypeScript
- Drizzle ORM
- Supabase（PostgreSQL / Storage / Auth）
- Zod（バリデーション）

### AI
- Gemini 2.0 Flash
  - チャットウィザード
  - AIアドバイス生成
  - レシートOCR（Vision）

---

## リポジトリ構成（モノレポ）

lifebalance/
├── apps/
│   ├── web/        # Next.js フロントエンド
│   └── api/        # Hono バックエンド（Bun）
├── packages/
│   └── shared/     # 共通型
├── docker-compose.yml
├── AGENT.md        # 実装方針ガイド（詳細）
└── API.md          # API仕様（エンドポイント/スキーマ）

---

## セットアップ

### 1) 依存関係
このリポジトリは `pnpm` + `Turborepo` 前提です。

```bash
pnpm install

2) 環境変数

apps/web/.env.local

# Supabase（認証のみフロントから直接使用）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# バックエンドAPIのベースURL
# Docker Compose経由の場合は http://api:8787 ではなく「ブラウザから見える」 http://localhost:8787 を指定
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787

apps/api/.env

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# LINE（Phase 4）
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=

# サーバー設定
PORT=8787
FRONTEND_URL=http://localhost:3000

注意: .env* は必ず .gitignore に追加し、機密情報をコミットしないでください。

⸻

起動方法

ローカル（pnpm）

# フロント/バック同時起動
pnpm dev

# フロントのみ
pnpm dev --filter web

# バックのみ
pnpm dev --filter api

Docker Compose（開発用）

本プロジェクトは 開発環境のみ を対象としています（本番デプロイ用イメージ不要）。

# 初回（ビルドして起動）
docker compose up --build

# 以降（バックグラウンド起動）
docker compose up -d

# ログ
docker compose logs -f
docker compose logs -f web
docker compose logs -f api

# 停止
docker compose down

DBマイグレーション（コンテナ内から実行）
ホスト側のBun差異を避けるため、マイグレーションはコンテナ内実行を推奨します。

docker compose exec api bun run db:generate
docker compose exec api bun run db:migrate


⸻

仕様ハイライト

認証
	•	Supabase Auth（メール + パスワード）
	•	フロント: Supabase SDKでセッション管理
	•	バック: Authorization: Bearer <JWT> を Supabase で検証（auth.getUser(token)）

エラーレスポンス（統一形式）

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amount is required"
  }
}

ページネーション（一覧API共通）

{
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "has_next": true
  }
}


⸻

開発フェーズ（目安）
	•	Phase 1: フロント完成（静的データでUI）
	•	Phase 2: バックエンド & DB（CRUD + 認証 + API結合）
	•	Phase 3: AI機能（OCR/アドバイス/シミュレーション/チャットAI化）
	•	Phase 4: 外部連携（LINE）
	•	Phase 5: 品質整備（テスト/統合テスト/性能改善）

⸻

コーディング規約（要点）
	•	TypeScript strict
	•	命名: camelCase（変数/関数）, PascalCase（型/コンポーネント）, snake_case（DBカラム）
	•	ルートハンドラは薄く（validate → service → response）
	•	DB操作は apps/api/src/db/ の関数に集約
	•	フロントは TanStack Query を基本に、Mutation後は invalidateQueries

⸻

ドキュメント
	•	実装方針（詳細）: AGENT.md
	•	API仕様（エンドポイント/スキーマ）: API.md

⸻

トラブルシューティング（Docker）
	•	node_modules 関連エラー:

docker compose down -v
docker compose up --build


	•	Hot Reloadが効かない: Dockerの File Sharing 設定にプロジェクトパスが含まれているか確認
	•	環境変数が反映されない: .env.local / .env の存在確認 → docker compose up を再起動

⸻