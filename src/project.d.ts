interface Unregistered {
  partner: string;
  documentType: string;
}

interface UnregisteredList {
  partner: string[];
  documentType: string[];
}

interface ExtractPdfInfoOutput {
  date: string;
  partner: string;
  documentType: string;
  amount: string;
}

interface CommandLineOption {
  filter: string;
  skipFormatCheck: boolean;
  model: string;
  tradingPartnerFile: string;
  documentTypeFile: string;
}

/**
 * スピナークラス
 */
declare class Spinner {
  private spin_char: string[];
  private timer: NodeJS.Timeout | null;
  /**
   * スピナーを開始する
   * @param message 表示するメッセージ
   */
  start(message: string): void;
  /**
   * スピナーを停止する
   */
  stop(): void;
}

interface Config {
  model: string;
  tradingPartnerFile: string;
  documentTypeFile: string;
  rule: {
    fileNameFormat: string;
    dateFormat: string;
  };
  myCompany: {
    name: string;
    alias: string[];
  };
}
