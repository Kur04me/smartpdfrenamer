#!/usr/bin/env node

import { extractPdfInfo } from "./chatgpt";
import path from "path";
import fs from "fs";
import * as readline from "readline/promises";
import { Spinner } from "./spinner";
import { Command } from "commander";
import { config } from "./config";

// CLIの設定
const program = new Command();

function validationOptionArgument(value: string) {
  if (!value.trim()) throw new Error("-fオプションの値が指定されていません。");
  if (value.startsWith("-"))
    throw new Error("-fオプションの値が指定されていません。");
  try {
    new RegExp(value);
  } catch (error) {
    throw new Error("-fオプションの値が正規表現のパターンとして不正です。");
  }
  return value;
}

program
  .name("p2f")
  .description(
    `PDFの内容をChatGPTに読み取らせて電子帳簿保存法に則したファイル名にリネームします。
デフォルトでは"20250101_丸山商事_請求書_2000.pdf"のように{YYYYMMDD}_{取引先名}_{証憑種別}_{金額}.pdfのフォーマットでリネームします。`
  )
  .version("1.0.0")
  .option(
    "-f, --filter <regex>",
    `正規表現でファイル名をフィルタリングしてからリネームします。
ディレクトリを指定した場合は無効になります。
例: -f "^d{8}_hoge_.*?_[0-9]+"`,
    validationOptionArgument
  )
  .option(
    "-s, --skip-format-check",
    "リネーム前のファイル名チェックをOFFにします。全てのファイルがリネームされます。"
  )
  .option("-m, --model <model>", "使用するモデルを指定します。", "gpt-4o")
  .option(
    "-t, --trading-partner-file <file>",
    "取引先ファイルを指定します。",
    "trading_partners.csv"
  )
  .option(
    "-d, --document-type-file <file>",
    "証憑種別ファイルを指定します。",
    "document_type.csv"
  )
  .argument("<path>", "処理するPDFファイルまたはPDFフォルダのパス")
  .action((pdfPath, options: CommandLineOption) => {
    if (options.tradingPartnerFile) {
      config.tradingPartnerFile = options.tradingPartnerFile;
    }
    if (options.documentTypeFile) {
      config.documentTypeFile = options.documentTypeFile;
    }

    main(pdfPath, options);
  })
  .parse(process.argv);

async function renamePdf(pdfPath: string, options: CommandLineOption) {
  const fileName = path.basename(pdfPath);
  // ファイル名のフォーマットチェック
  if (!options.skipFormatCheck && fileName.match(/^[0-9]{8}_.*?_.*?_[0-9]+\.pdf$/)) {
    console.log(`${fileName}はすでにフォーマットが適用されています。`);
    return { partner: "", documentType: "" };
  }
  const { output, unregistered } = await extractPdfInfo(pdfPath, options);

  const newFileName = `${output.date}_${output.partner}_${output.documentType}_${output.amount}.pdf`;
  fs.renameSync(pdfPath, path.join(path.dirname(pdfPath), newFileName));
  console.log(`Renamed: ${fileName} -> ${newFileName}`);
  return unregistered;
}

async function solveUnregistered(unregisteredList: UnregisteredList) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    // 配列の重複の除去
    const unregisteredPartner = Array.from(new Set(unregisteredList.partner));
    const unregisteredDocumentType = Array.from(
      new Set(unregisteredList.documentType)
    );
    // 未登録の取引先、証憑種別を登録
    for (const partner of unregisteredPartner) {
      const answer = await rl.question(
        `${partner}は未登録の取引先です。登録しますか？登録する場合は取引先名を入力してください。しない場合はEnterを押してください。`
      );
      if (answer !== "") {
        fs.appendFileSync(
          path.join(__dirname, "..", config.tradingPartnerFile),
          `,${answer.trim()}`
        );
      }
    }
    for (const documentType of unregisteredDocumentType) {
      const answer = await rl.question(
        `${documentType}は未登録の証憑種別です。登録しますか？登録する場合は証憑種別名を入力してください。しない場合はEnterを押してください。`
      );
      if (answer !== "") {
        fs.appendFileSync(
          path.join(__dirname, "..", config.documentTypeFile),
          `,${answer.trim()}`
        );
      }
    }
  } finally {
    rl.close();
  }
}

async function main(pdfPath: string, options: CommandLineOption) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const spinner = new Spinner();
    const absolutePath = path.resolve(pdfPath);

    // ファイルかディレクトリで分岐
    const stats = fs.statSync(absolutePath);
    if (stats.isFile()) {
      spinner.start(`処理中: ${absolutePath}`);
      const { partner, documentType } = await renamePdf(absolutePath, options);
      spinner.stop();
      await solveUnregistered({ partner: [partner], documentType: [documentType] }); // 未登録の取引先、証憑種別を登録
      process.exit(0);
    } else if (stats.isDirectory()) {
      const answer = await rl.question(
        "ディレクトリが指定されました。指定されたディレクトリのPDFファイルを処理しますか？[y/n] "
      );
      if (answer === "y") {
        const regex = new RegExp(options.filter);
        let files = fs
          .readdirSync(absolutePath)
          .filter((file) => file.endsWith(".pdf"));
        // filterオプションが指定されている場合はファイル名をフィルタリング
        if (options.filter) {
          files = files.filter((file) => regex.test(file));
        }
        const unregisteredList: UnregisteredList = { partner: [], documentType: [] };
        const failedFiles: string[] = [];
        for (let i = 0; i < files.length; i++) {
          try {
            console.log(`${i + 1} / ${files.length} 処理中: ${files[i]}`);
            const { partner, documentType } = await renamePdf(
              path.join(absolutePath, files[i]),
              options
            );
            unregisteredList.partner.push(...partner);
            unregisteredList.documentType.push(...documentType);
          } catch (error) {
            failedFiles.push(files[i]);
          }
        }
        await solveUnregistered(unregisteredList); // 未登録の取引先、証憑種別を登録
        process.exit(0);
      } else {
        console.log("処理を中止します。");
        process.exit(0);
      }
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}
