import {
  ChatGPTModel,
  ChatGPTRequestBody,
  CommandLineOption,
  ExtractPdfInfoOutput,
} from "./types/index";
import OpenAI from "openai";
import config from "./config";
import "dotenv/config";
import fs from "fs";
import path from "path";

// 20250628現在、ChatGPTのAPIが受け取れるpdfは100ページまで、32MBまで
const partnerList = fs.readFileSync(
  path.join(__dirname, "..", config.tradingPartnerFile),
  "utf-8"
);
const documentTypeList = fs.readFileSync(
  path.join(__dirname, "..", config.documentTypeFile),
  "utf-8"
);
const prompt = `
PDFから商取引に関する情報を抽出し、以下のJSONフォーマットで返答してください。

# 出力フォーマット
{"date":"取引日(${config.rule.dateFormat})",
"partner":"取引先名",
"documentType":"書類種別",
"amount":"金額(カンマなしの数字のみ)"}

# 抽出指針

## 日付抽出 (date)
- 書類の発行日、請求日、取引日を探してください
- 年号は西暦に変換してください（令和6年→2024年）
- 形式: ${config.rule.dateFormat}（例: 20241225）
- ヘッダー、フッター、表内の日付も確認してください

## 取引先抽出 (partner)
- 「○○株式会社」「有限会社○○」「○○商事」などの企業名を探してください
- 「宛先」「請求先」「発行者」「販売者」「納品先」などの項目から抽出してください
- 住所と一緒に記載されている企業名を優先してください
${
  config.myCompany.name
    ? `- 自社名（${config.myCompany.name}${
        config.myCompany.alias ? `,${config.myCompany.alias.join(",")}` : ""
      }）は除外してください`
    : ""
}

## 書類種別抽出 (documentType)
- 「見積書」「納品書」「請求書」「領収書」「注文書」などの文字を探してください
- ヘッダー部分やタイトルを重点的に確認してください
- 「INVOICE」→「請求書」、「RECEIPT」→「領収書」のように英語は日本語に変換してください

## 金額抽出 (amount)
- 「合計」「総額」「小計」「税込計」などの最終金額を探してください
- カンマ、円マーク、税表記を除去し数字のみを出力してください
- 複数の金額がある場合は最も大きな合計金額を選択してください

# 重要なルール
1. **「取得不可」は最後の手段**: あらゆる角度から情報を探し、部分的でも抽出してください
2. **推測を活用**: 完全一致しなくても類似する情報から推測してください
3. **文脈を活用**: 書類全体の文脈から不足情報を補完してください
4. **レイアウト無視**: 表の外、ヘッダー、フッター、隅にある情報も見逃さないでください

# 既存データ参照
## 登録済み取引先
${partnerList}

## 登録済み証憑種別
${documentTypeList}

上記リストにない場合でも、PDFから抽出した情報を優先して使用してください。

# 出力形式
JSONのみを出力し、説明文や追加コメントは一切含めないでください。
JSON:`;

export class Client {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async getResponse(body: ChatGPTRequestBody) {
    return await this.openai.responses.create(body);
  }
}

export async function extractInformationFromPDF(
  filePath: string,
  options?: CommandLineOption
) {
  let base64String: string;
  try {
    const data = fs.readFileSync(filePath);
    base64String = data.toString("base64");
  } catch (error) {
    throw error;
  }
  const body: ChatGPTRequestBody = {
    model: config.model as ChatGPTModel,
    ...(config.model !== "gpt-5" && { temperature: config.temperature }),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: path.basename(filePath),
            file_data: `data:application/pdf;base64,${base64String}`,
          },
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
  };
  const client = new Client();
  try {
    const response = await client.getResponse(body);
    const { output_text } = response;
    if (output_text) {
      if (options?.debug) {
        console.log("Response:", output_text);
      }
      return JSON.parse(
        output_text.slice(
          output_text.indexOf("{"),
          output_text.lastIndexOf("}") + 1
        )
      ) as ExtractPdfInfoOutput;
    } else {
      throw new Error(
        `レスポンスに結果が含まれていません。response: ${JSON.stringify(
          response
        )}`
      );
    }
  } catch (error) {
    throw error;
  }
}

async function test() {
  console.log("Testing ChatGPT Client...");
  const result = await extractInformationFromPDF(
    path.join(__dirname, "../test/data/sample.pdf")
  );
  console.log(result);
}
if (require.main === module) {
  // モジュールが直接実行された場合のみテストを実行
  test();
}
