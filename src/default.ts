export const defaultConfig: Config = {
  model: "gpt-4o-mini",
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
};

export const DEFAULT_DOCUMENT_TYPE = [
  "見積書",
  "納品書",
  "請求書",
  "領収書",
  "注文書",
];
