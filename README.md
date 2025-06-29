# SmartPDFRenamer 🚀

PDFファイルの内容をChatGPT APIで解析して、電子帳簿保存法に則したファイル名を自動生成するCLIツールです。

## 前提

**Node.js（v18以上推奨）がインストールされている必要があります。**  
[Node.js公式サイト](https://nodejs.org/)

## 機能

- PDFファイルの内容をOpenAIで解析
- 電子帳簿保存法に則したファイル名を自動生成
- 単一ファイルまたはディレクトリ内の全PDFファイルのバッチ処理
- 未登録の取引先や証憑種別をインタラクティブに登録可能
- **テストモード** - API呼び出しを行うがファイルリネームを行わない
- **デバッグモード** - リクエスト・レスポンス内容の確認が可能
- **並列処理** - 複数ファイルの同時処理による高速化
- 正規表現フィルタリング機能
- 既にフォーマット適用済みファイルの自動スキップ

## インストール方法

```bash
# リポジトリをクローン
git clone https://github.com/Kur04me/smartpdfrenamer.git
cd smartpdfrenamer

# 依存関係をインストール
npm install

# TypeScriptをビルド
npm run build
```

## 使用方法

### 基本的な使用方法

```bash
npx p2f <PDFファイルのパス>
```

### オプション

- `--test`: テストモード（APIは呼び出すがファイルのリネームは行わない）
- `-f, --filter <regex>`: 正規表現でファイル名をフィルタリング
- `-s, --skip-format-check`: リネーム前のファイル名チェックをスキップ
- `-m, --model <model>`: 使用するGPTモデルを指定（デフォルト: gpt-4o）
- `-t, --trading-partner-file <file>`: 取引先ファイルを指定（デフォルト: trading_partners.csv）
- `-d, --document-type-file <file>`: 証憑種別ファイルを指定（デフォルト: document_type.csv）
- `--debug`: デバッグモードをON（リクエスト・レスポンス内容を表示）

### ディレクトリ内の全PDFファイルの処理

```bash
npx p2f <ディレクトリのパス>
```

## 設定 🔧

### 環境変数

`.env`ファイルに以下の環境変数を設定してください：

```
OPENAI_API_KEY=your_api_key_here
```

### 設定ファイル

`config.json`で以下の設定が可能です：

```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.1,
  "tradingPartnerFile": "trading_partners.csv",
  "documentTypeFile": "document_type.csv",
  "rule": {
    "fileNameFormat": "{date}_{partner}_{documentType}_{amount}.pdf",
    "dateFormat": "YYYYMMDD"
  },
  "myCompany": {
    "name": "自社名",
    "alias": ["別名1", "別名2"]
  },
  "maxConcurrentApiCalls": 3
}
```

## ファイル名のフォーマット 📝

生成されるファイル名は以下のフォーマットに従います：

```
{日付}_{取引先名}_{証憑種別}_{金額}.pdf
```

- 日付: YYYYMMDD形式
- 取引先名: 取引先リストから選択または新規生成
- 証憑種別: 証憑種別リストから選択または新規生成
- 金額: コンマなしの半角数字

## 特殊機能

### テストモード
`--test` オプションを使用すると、OpenAI APIは呼び出されますが実際のファイルリネームは行われません。処理内容の確認に便利です。

### デバッグモード
`--debug` オプションを付けて実行すると、OpenAI APIへのリクエストボディやレスポンス内容が出力されます（PDFのbase64データは省略されます）。トラブルシュートや処理内容の確認に便利です。

### 並列処理
ディレクトリ処理時は、設定ファイルの `maxConcurrentApiCalls` で指定された数だけAPIを並列実行し、処理を高速化します。

## 依存関係 📦

- **commander**: CLIインターフェース
- **deepmerge**: 設定ファイルのマージ
- **dotenv**: 環境変数管理
- **listr2**: 並列処理とプログレス表示
- **openai**: OpenAI API クライアント
- **typescript**: TypeScript サポート

## ライセンス 📄

ISC 
