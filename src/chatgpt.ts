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

const prompt = `
pdfの内容を読み込み、以下のフォーマットのJSONで返答してください。

# JSONフォーマット
{"date":"取引日(${config.rule.dateFormat})",
"partner":"取引先名",
"documentType":"書類種別(例: 見積書, 納品書, 請求書, 領収書, 注文書)",
"amount":"金額(カンマなしの数字のみ"}

# 注意点
- 最終応答は、"{"で始まり"}"で終わるJSONのみを出力し、JSON以外の文字は一切応答に含めないでください。
${
  config.myCompany.name
    ? `- 自社の名前は"${config.myCompany.name}"${
        config.myCompany.alias ? `,${config.myCompany.alias.join(",")}` : ""
      }です。`
    : ""
}

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
    if (response.output_text) {
      return JSON.parse(response.output_text) as ExtractPdfInfoOutput;
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
