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
pdfから情報を抽出し、以下のフォーマットのJSONで返答してください。

# JSONフォーマット
{"date":"取引日(${config.rule.dateFormat})",
"partner":"取引先名",
"documentType":"書類種別(例: 見積書, 納品書, 請求書, 領収書, 注文書)",
"amount":"金額(カンマなしの数字のみ"}

# 注意点
- 既存の取引先名や証憑種別を入力するので参照してください。
- 取引先名や証憑種別が既存のものと異なる場合は抽出したものを使用してください。
- 項目の内容が取得できない場合は、その項目について"取得不可"と出力してください。
- 最終応答は、"{"で始まり"}"で終わるJSONのみを出力し、JSON以外の文字は一切応答に含めないでください。
${
  config.myCompany.name
    ? `- 自社の名前は"${config.myCompany.name}"${
        config.myCompany.alias ? `,${config.myCompany.alias.join(",")}` : ""
      }です。`
    : ""
}

# 取引先
${partnerList}

# 証憑種別
${documentTypeList}

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
    temperature: 0,
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
