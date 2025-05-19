import fs from "fs";
import OpenAI from "openai";
import path from "path";
import { config } from "./config";
import "dotenv/config";

let apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error(`APIキーが設定されていません。処理を終了します。`);
  process.exit(1);
}
const client = new OpenAI({ apiKey: apiKey });

const partners = fs.readFileSync(
  path.join(__dirname, "..", config.tradingPartnerFile),
  "utf-8"
);
const documentType = fs.readFileSync(
  path.join(__dirname, "..", config.documentTypeFile),
  "utf-8"
);
const prompt = `
## Task
pdfの内容から情報を抽出してJSON形式で出力。

## Response format
JSON形式
{date: 日付, partner: 取引先名, documentType: 証憑種別, amount: 金額}

## Values
- 日付...${config.rule.dateFormat}形式。
- 取引先名...後述の取引先名リストから優先して選択。合致するものがなければ内容から抽出。
- 証憑種別...後述の証憑種別から優先して選択。合致するものがなければ内容を考慮して新たに生成。
- 金額...コンマなしの半角数字のみ。存在しない場合は0を出力。

## 注意点
- ${config.myCompany.name}${config.myCompany.alias.length > 0
    ? "若しくは" + config.myCompany.alias.join(",")
    : ""
  }は自社の名前の為、取引先名には使用しない。
- 生成する文字列はjavascriptのJSON.parse()でパース可能な形式にしてください。
- プロパティ名もダブルクォートで囲むようにしてください。
- コードブロックは不要です。

## 取引先リスト
${partners}

## 証憑種別
${documentType}
`;

/**
 * PDFファイルから書類情報(日付、取引先名、証憑種別、金額)を抽出する
 * @param path PDFファイルのパス
 */
export async function extractPdfInfo(
  pdfPath: string,
  options: CommandLineOption
) {
  // pdf -> base64
  const filename = path.basename(pdfPath);
  const data = fs.readFileSync(pdfPath);
  const base64String = data.toString("base64");
  // ファイル名を生成
  const body: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
    model: options.model || config.model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: filename,
            file_data: `data:application/pdf;base64,${base64String}`,
          },
          {
            type: "input_text",
            text: prompt + (options.extraPrompt ? `\n## 追加のプロンプト\n${options.extraPrompt}` : ""),
          },
        ],
      },
    ],
  };
  if (options.debug) {
    const debugBody = JSON.parse(JSON.stringify(body));
    debugBody.input[0].content[0].file_data = "[base64省略]";
    console.log(`Request body`);
    console.dir(debugBody, { depth: null });
  }
  const response = await client.responses.create(body);
  const responseOutputText = response.output_text;
  if (options.debug) console.log(`response.output_text: ${responseOutputText}`);
  const output = JSON.parse(responseOutputText) as ExtractPdfInfoOutput;
  // 未登録の取引先名と証憑種別を抽出
  const unregistered: Unregistered = { partner: "", documentType: "" };
  const partnerArray = partners.split(",");
  const documentTypeArray = documentType.split(",");
  if (!partnerArray.includes(output.partner)) {
    unregistered.partner = output.partner;
  }
  if (!documentTypeArray.includes(output.documentType)) {
    unregistered.documentType = output.documentType;
  }
  return { output, unregistered };
}
