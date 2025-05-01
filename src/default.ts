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