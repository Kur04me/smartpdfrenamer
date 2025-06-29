#!/usr/bin/env node

import {
  CommandLineOption,
  UnregisteredList,
  ExtractPdfInfoOutput,
  UnregisteredItem,
  RenameResult,
} from "./types/index";
import { Client, extractInformationFromPDF } from "./chatgpt";
import path from "path";
import fs from "fs";
import * as readline from "readline/promises";
import { Command } from "commander";
import config from "./config";
import { DEFAULT_DOCUMENT_TYPE } from "./default";
import { Listr } from "listr2";

// CLIの設定
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
const program = new Command();
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
  .option("--debug", "デバッグモードをONにします。")
  .argument("<path>", "処理するPDFファイルまたはPDFフォルダのパス")
  .action((pdfPath, options: CommandLineOption) => {
    if (options.tradingPartnerFile) {
      config.tradingPartnerFile = options.tradingPartnerFile;
    }
    if (options.documentTypeFile) {
      config.documentTypeFile = options.documentTypeFile;
    }

    main(pdfPath, options);
  });

// 直接実行された場合のみCommanderのパースを実行
if (require.main === module) {
  program.parse(process.argv);
}

/**
 * ユーザー入力の正規化関数
 * @param input ユーザー入力
 * @returns 正規化された文字列
 */
function normalizeInput(input: string): string {
  return input
    .trim()
    .replace("　", " ")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    .toLowerCase();
}

async function checkRegistered(output: ExtractPdfInfoOutput): Promise<UnregisteredItem> {
  const unregisteredItem: UnregisteredItem = { partner: "", documentType: "" };
  const tradingPartnerFile = path.join(
    __dirname,
    "..",
    config.tradingPartnerFile
  );
  const documentTypeFile = path.join(__dirname, "..", config.documentTypeFile);

  // 取引先の登録チェック
  const tradingPartners = fs
    .readFileSync(tradingPartnerFile, "utf-8")
    .split(",");
  if (!tradingPartners.includes(output.partner)) {
    unregisteredItem.partner = output.partner;
  }

  // 証憑種別の登録チェック
  const documentTypes = fs.readFileSync(documentTypeFile, "utf-8").split(",");
  if (!documentTypes.includes(normalizeInput(output.documentType))) {
    unregisteredItem.documentType = output.documentType;
  }

  return unregisteredItem;
}

async function renamePdf(pdfPath: string, options: CommandLineOption): Promise<RenameResult> {
  const extractedInfo = await extractInformationFromPDF(pdfPath, options);
  const newFileName = config.rule.fileNameFormat
    .replace("{date}", extractedInfo.date)
    .replace("{partner}", extractedInfo.partner)
    .replace("{documentType}", extractedInfo.documentType)
    .replace("{amount}", extractedInfo.amount);
  
  fs.renameSync(pdfPath, path.join(path.dirname(pdfPath), newFileName));
  const unregisteredItem = await checkRegistered(extractedInfo);
  
  return { 
    newFileName: newFileName, 
    unregistered: unregisteredItem
  };
}

async function solveUnregistered(
  unregisteredList: UnregisteredList,
  rl: readline.Interface
) {
  try {
    // 配列の重複の除去
    const unregisteredPartner = Array.from(
      new Set(unregisteredList.partner)
    ).filter(Boolean);
    const unregisteredDocumentType = Array.from(
      new Set(unregisteredList.documentType)
    ).filter(Boolean);
    // 未登録の取引先、証憑種別を登録
    for (let index = 0; index < unregisteredPartner.length; index++) {
      const partner = unregisteredPartner[index];
      const answer = await rl.question(
        `[${index + 1}/${
          unregisteredPartner.length
        }] "${partner}"は未登録の取引先です。登録しますか？\nこのまま登録する場合は"y"を、取引先名が誤っている場合は正しい取引先名を入力してください。登録しない場合はEnterを押してください`
      );
      const tAnswer = answer.trim();
      if (tAnswer === "y" || tAnswer === "Y" || tAnswer === "Ｙ") {
        fs.appendFileSync(
          path.join(__dirname, "..", config.tradingPartnerFile),
          `,${partner}`
        );
      }
      if (tAnswer !== "") {
        fs.appendFileSync(
          path.join(__dirname, "..", config.tradingPartnerFile),
          `,${tAnswer}`
        );
      }
    }
    for (let index = 0; index < unregisteredDocumentType.length; index++) {
      const documentType = unregisteredDocumentType[index];
      const answer = await rl.question(
        `[${index + 1}/${
          unregisteredDocumentType.length
        }] "${documentType}"は未登録の証憑種別です。登録しますか？\nこのまま登録する場合は"y"を、証憑種別名が誤っている場合は正しい証憑種別名を入力してください。登録しない場合はEnterを押してください`
      );
      const tAnswer = answer.trim();
      if (tAnswer === "y" || tAnswer === "Y" || tAnswer === "Ｙ") {
        fs.appendFileSync(
          path.join(__dirname, "..", config.documentTypeFile),
          `,${documentType}`
        );
      }
      if (tAnswer !== "") {
        fs.appendFileSync(
          path.join(__dirname, "..", config.documentTypeFile),
          `,${tAnswer}`
        );
      }
    }
  } catch (error) {
    throw error;
  }
}

function csvFileCheck(options: CommandLineOption) {
  if (options.debug) console.log("csvFileCheck");
  const tradingPartnerFile = path.join(
    __dirname,
    "..",
    config.tradingPartnerFile
  );
  const documentTypeFile = path.join(__dirname, "..", config.documentTypeFile);
  if (!fs.existsSync(tradingPartnerFile)) {
    if (options.debug)
      console.log("tradingPartnerFileが存在しないため、新たに作成します。");
    fs.writeFileSync(tradingPartnerFile, "");
  }
  if (!fs.existsSync(documentTypeFile)) {
    if (options.debug)
      console.log("documentTypeFileが存在しないため、新たに作成します。");
    fs.writeFileSync(documentTypeFile, DEFAULT_DOCUMENT_TYPE.join(","));
  }
  if (options.debug) console.log("csvFileCheck passed.");
  return;
}

async function companyNameCheck(
  options: CommandLineOption,
  rl: readline.Interface
) {
  if (options.debug) console.log("companyNameCheck");
  if (config.myCompany.name === "") {
    const answer = await rl.question(
      `company.nameが指定されていません。自社の名前を登録することで証憑内に含まれる自社の名前が誤って取引先として扱われることを防ぐ為、設定することを推奨します。
      処理を中止しますか？ [y/n]`
    );
    const tAnswer = answer.trim();
    if (
      tAnswer === "y" ||
      tAnswer === "Y" ||
      tAnswer === "Ｙ" ||
      tAnswer === ""
    ) {
      console.log("処理を中止します。");
      process.exit(0);
    }
  }
  if (options.debug) console.log("companyNameCheck passed.");
  return;
}

function isValidFileNameFormat(filePath: string): boolean {
  const fileName = path.basename(filePath);
  const fileNameFormatRule = config.rule.fileNameFormat;
  // プレースホルダーを正規表現パターンに変換
  const pattern = fileNameFormatRule
    .replace(/\{date\}/g, "[0-9]+") // YYYYMMDD形式
    .replace(/\{partner\}/g, "[^_]+") // アンダースコア以外の文字
    .replace(/\{documentType\}/g, "[^_]+") // アンダースコア以外の文字
    .replace(/\{amount\}/g, "[0-9]+") // 数字のみ
    .replace(/\./g, "\\."); // ドットをエスケープ
  const regex = new RegExp(`^${pattern}$`);
  return regex.test(fileName);
}

async function main(pdfPath: string, options: CommandLineOption) {
  // 設定チェック
  csvFileCheck(options);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await companyNameCheck(options, rl);

  try {
    const absolutePath = path.resolve(pdfPath);

    // ファイルパスの場合
    const stats = fs.statSync(absolutePath);
    if (stats.isFile()) {
      if (!isValidFileNameFormat(absolutePath)) {
        const renameResult = await renamePdf(absolutePath, options);
        // 未登録項目を配列に変換
        const unregisteredList: UnregisteredList = {
          partner: renameResult.unregistered.partner ? [renameResult.unregistered.partner] : [],
          documentType: renameResult.unregistered.documentType ? [renameResult.unregistered.documentType] : []
        };
        await solveUnregistered(unregisteredList, rl);
      } else {
        console.log(
          `${path.basename(absolutePath)}は既にフォーマットが適用されています。`
        );
      }
      process.exit(0);
    }

    // ディレクトリパスの場合
    const answer = await rl.question(
      "ディレクトリが指定されました。指定されたディレクトリのPDFファイルを処理しますか？[y/n] "
    );

    if (answer === "y") {
      const regex = new RegExp(options.filter);
      let files = fs
        .readdirSync(absolutePath)
        .filter((file) => file.endsWith(".pdf"));
      console.log(`${pdfPath}にあるpdfファイル数: ${files.length}`);
      // filterオプションが指定されている場合はファイル名をフィルタリング
      if (options.filter) {
        files = files.filter((file) => regex.test(file));
        console.log(
          `filterオプションが指定され、${files.length}件のファイルがフィルタリングされました。`
        );
      }
      // ファイル名フォーマットチェック
      const amountFiles = files.length;
      files = files.filter(
        (file) => !isValidFileNameFormat(path.join(absolutePath, file))
      );
      const amountFilesWithInvalidFileNameFormat = files.length;
      const amountFilesWithValidFileNameFormat =
        amountFiles - amountFilesWithInvalidFileNameFormat;
      console.log(
        `${amountFiles}件のファイルのうち、${amountFilesWithValidFileNameFormat}件のファイルはフォーマットが適用されています。`
      );
      console.log(
        `${amountFilesWithInvalidFileNameFormat}件のファイルを処理します。`
      );

      // 対象ファイルの処理
      const unregisteredList: UnregisteredList = {
        partner: [],
        documentType: [],
      };
      const failedFiles: string[] = [];

      // Listr2を使用した並列処理
      const tasks = new Listr(
        files.map((file) => ({
          title: `処理中：${file}`,
          task: async (ctx, task) => {
            try {
              const renameResult = await renamePdf(
                path.join(absolutePath, file),
                options
              );
              // 未登録項目のみをリストに追加
              if (renameResult.unregistered.partner) {
                unregisteredList.partner.push(renameResult.unregistered.partner);
              }
              if (renameResult.unregistered.documentType) {
                unregisteredList.documentType.push(renameResult.unregistered.documentType);
              }
              task.title = `完了：${renameResult.newFileName}`;
            } catch (error) {
              failedFiles.push(file);
              task.title = `失敗：${file}`;
              throw error;
            }
          },
        })),
        {
          concurrent: config.maxConcurrentApiCalls,
          exitOnError: false,
        }
      );

      await tasks.run();

      console.log(`処理したファイル数: ${files.length}`);
      console.log(`処理に失敗したファイル数: ${failedFiles.length}`);
      if (failedFiles.length > 0) {
        console.log(`失敗したファイル: ${failedFiles.join(", ")}`);
      }
      await solveUnregistered(unregisteredList, rl); // 未登録の取引先、証憑種別を登録
      process.exit(0);
    } else {
      console.log("処理を中止します。");
      process.exit(0);
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}
