# SmartPDFRenamer 🚀

PDFファイルの内容を解析して、電子帳簿保存法に則したファイル名を自動生成するCLIツールです。

## 前提

**Node.js（v18以上推奨）と git がインストールされている必要があります。**  
[Node.js公式サイト](https://nodejs.org/)  
[git公式サイト](https://git-scm.com/)

## 機能

- PDFファイルの内容をChatGPTで解析
- 電子帳簿保存法に則したファイル名を自動生成
- 単一ファイルまたはディレクトリ内の全PDFファイルに対応
- 日本語と英語の両方に対応
- 未登録の取引先や証憑種別をインタラクティブに登録可能
- **デバッグモードでリクエスト・レスポンス内容を確認可能**
- **ChatGPTへの追加指示文（プロンプト）を柔軟に指定可能**

## インストール方法

```bash
# gitをクローン
git clone https://github.com/Kur04me/smartpdfrenamer.git

# パッケージをインストール
npm install

# ビルド
npm run build
```

## 使用方法

### 基本的な使用方法

```bash
npx p2f <PDFファイルのパス>
```

### オプション

- `-f, --filter <regex>`: 正規表現でファイル名をフィルタリング
- `-s, --skip-format-check`: リネーム前のファイル名チェックをスキップ
- `-m, --model <model>`: 使用するChatGPTモデルを指定（デフォルト: gpt-4o-mini）
- `-t, --trading-partner-file <file>`: 取引先ファイルを指定（デフォルト: trading_partners.csv）
- `-d, --document-type-file <file>`: 証憑種別ファイルを指定（デフォルト: document_type.csv）
- `--debug`: デバッグ用のログを出力します
- `-e, --extra-prompt <prompt>`: ChatGPTへの追加プロンプト（指示文）を指定

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
  "tradingPartnerFile": "trading_partners.csv",
  "documentTypeFile": "document_type.csv",
  "rule": {
    "fileNameFormat": "{date}_{partner}_{documentType}_{amount}.pdf",
    "dateFormat": "YYYYMMDD"
  },
  "myCompany": {
    "name": "自社名",
    "alias": ["別名1", "別名2"]
  }
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

## デバッグモードについて

`--debug` オプションを付けて実行すると、ChatGPTへのリクエストボディやレスポンス内容が出力されます（PDFのbase64データは省略されます）。  
トラブルシュートやプロンプト調整時に便利です。

## 依存関係 📦

- dotenv
- openai
- typescript
- commander

## ライセンス 📄

ISC 
