import { Config } from "./types";

export const defaultConfig: Config = {
  model: "gpt-5",
  temperature: 0.1,
  tradingPartnerFile: "trading_partners.csv",
  documentTypeFile: "document_type.csv",
  rule: {
    fileNameFormat: "{date}_{partner}_{documentType}_{amount}.pdf",
    dateFormat: "YYYYMMDD",
  },
  myCompany: {
    name: "",
    alias: [],
  },
  maxConcurrentApiCalls: 3,
};

export const DEFAULT_DOCUMENT_TYPE = [
  "見積書",
  "納品書",
  "請求書",
  "領収書",
  "注文書",
];
