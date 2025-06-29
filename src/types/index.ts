export interface Unregistered {
  partner: string;
  documentType: string;
}

export interface UnregisteredList {
  partner: string[];
  documentType: string[];
}

export interface ExtractPdfInfoOutput {
  date: string;
  partner: string;
  documentType: string;
  amount: string;
}

export interface CommandLineOption {
  filter: string;
  skipFormatCheck: boolean;
  model: string;
  tradingPartnerFile: string;
  documentTypeFile: string;
  debug: boolean;
  extraPrompt: string;
}

/**
 * スピナークラス
 */
export declare class Spinner {
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

export interface ChatGPTRequestBody {
  model: ChatGPTModel;
  input: [
    {
      role: "user";
      content: [
        {
          type: "input_file";
          filename: string;
          file_data: string;
        },
        {
          type: "input_text";
          text: string;
        }
      ];
    }
  ];
}

export type Config = {
  model: ChatGPTModel;
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
};

export type ChatGPTModel =
  | "gpt-3.5-turbo"
  | "gpt-4"
  | "gpt-4-1106-preview"
  | "gpt-4.5-preview"
  | "gpt-4o"
  | "chatgpt-4o-latest"
  | "gpt-4o-mini"
  | "o1"
  | "o1-mini"
  | "o3-mini"
  | "o1-preview"
  | "gpt-4o-realtime-preview"
  | "gpt-4o-mini-realtime-preview"
  | "gpt-4o-audio-preview";
