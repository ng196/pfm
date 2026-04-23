import { parseBankSms } from "./parsers";

const parserRegistry = [
  {
    id: "hdfc_bank_parser_v1",
    match: (message) => /HDFC/i.test(message.sender),
    parse: (message) => parseBankSms(message, "hdfc_bank_parser_v1", "HDFC Bank"),
  },
  {
    id: "icici_bank_parser_v1",
    match: (message) => /ICICI/i.test(message.sender),
    parse: (message) => parseBankSms(message, "icici_bank_parser_v1", "ICICI Bank"),
  },
  {
    id: "axis_bank_parser_v1",
    match: (message) => /AXIS/i.test(message.sender),
    parse: (message) => parseBankSms(message, "axis_bank_parser_v1", "Axis Bank"),
  },
  {
    id: "sbi_bank_parser_v1",
    match: (message) => /SBI/i.test(message.sender),
    parse: (message) => parseBankSms(message, "sbi_bank_parser_v1", "SBI"),
  },
  {
    id: "kotak_bank_parser_v1",
    match: (message) => /KOTAK/i.test(message.sender),
    parse: (message) => parseBankSms(message, "kotak_bank_parser_v1", "Kotak"),
  },
];

export function getParserForMessage(message) {
  return parserRegistry.find((candidate) => candidate.match(message)) || null;
}

export function listRegisteredParsers() {
  return parserRegistry.map((parser) => ({ id: parser.id }));
}
