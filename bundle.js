// main.ts
var sheetURL = PropertiesService.getScriptProperties().getProperty("SHEET_URL");
function today() {
  const today2 = new Date();
  return {
    thisYear: today2.getUTCFullYear(),
    thisMonth: today2.getUTCMonth() + 1,
    thisDate: today2.getUTCDate()
  };
}
function getBook() {
  return SpreadsheetApp.openByUrl(sheetURL);
}
function getSheet() {
  const { thisYear, thisMonth } = today();
  const sheetName = `${thisYear}\u5E74${thisMonth}\u6708`;
  return getBook().getSheetByName(sheetName);
}
function extract(text) {
  const expr = /[0-9][0-9]?:?[0-9][0-9]-[0-9][0-9]?:?[0-9][0-9]?/;
  return text.split("\n").find((e) => expr.test(e));
}
function initMonth() {
  const today2 = new Date();
  const thisYear = today2.getUTCFullYear();
  const thisMonth = today2.getUTCMonth() + 1;
  const book = SpreadsheetApp.openByUrl(sheetURL);
  const firstSheet = book.getSheetByName("2022\u5E744\u6708");
  if (firstSheet === null) {
    throw "template sheet not found!";
  }
  const sheetName = `${thisYear}\u5E74${thisMonth}\u6708`;
  firstSheet.copyTo(book).setName(sheetName);
  const sheet = getSheet();
  sheet.getRange(4, 2).setValue(thisMonth);
  const daysCount = new Date(thisYear, thisMonth, 0).getUTCDate();
  if (daysCount > 30) {
    firstSheet.getRange(37, 1, 1, 12).copyTo(sheet.getRange(37, 1));
  }
  const data = [...Array(daysCount)].map((_, i) => [
    [(i + 1).toString().padStart(2, "0"), thisMonth, thisYear].join("/")
  ]);
  sheet.getRange(8, 1, daysCount, 1).setValues(data);
}
function parse(str) {
  function theDay(time) {
    const { thisYear, thisMonth, thisDate } = today();
    return new Date(Date.UTC(thisYear, thisMonth - 1, thisDate, time[0], time[1]));
  }
  return str.split(",").map((duration) => duration.split("-").map((d) => d.includes(":") ? theDay(d.split(":").map(Number)) : theDay([d.slice(0, -2), d.slice(-2)].map(Number))));
}
function main(e) {
  const { thisYear, thisMonth } = today();
  if (!getBook().getSheetByName(`${thisYear}\u5E74${thisMonth}\u6708`)) {
    initMonth();
  }
  const sheet = getSheet();
  const val = function transform(input) {
    const data = input.flatMap((e2) => e2).map((e2) => e2.getTime()).sort();
    return [data[0], data.slice(-1)[0], ...data.slice(1, -1)];
  }(parse(extract(e["text"])));
  function format(time) {
    return new Date(time).getUTCHours().toString().padStart(2, "0") + ":" + new Date(time).getUTCMinutes().toString().padStart(2, "0");
  }
  sheet.getRange(8 + new Date().getUTCDate() - 1, 3, 1, 8).setValues([
    Array.from({ length: 8 }, (_, i) => val[i] ? format(val[i]) : null)
  ]);
}

// src.ts
function debug(messgae, isErr = false) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (isErr) {
    const lastColumn = sheet.getRange(lastRow, 1).getLastColumn();
    sheet.getRange(lastRow, lastColumn + 1).setValue(messgae);
  } else {
    sheet.getRange(lastRow + 1, 1).setValue(messgae);
  }
}
function parse2(str) {
  try {
    const json = JSON.parse(str);
    return { result: json, isErr: false };
  } catch (error) {
    return { result: {}, isErr: true };
  }
}
function response(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function isValid(token) {
  return PropertiesService.getScriptProperties().getProperty("VERIFICATION_TOKEN") == token;
}
function doPost(e) {
  const s = e.postData.getDataAsString();
  debug(s);
  const parseResponse = parse2(s);
  if (parseResponse.isErr) {
    debug("parse error!", true);
    return response({ ok: false });
  }
  const json = parseResponse.result;
  if (json.type === "url_verification") {
    PropertiesService.getScriptProperties().setProperty("VERIFICATION_TOKEN", json.token);
    return response(json.challenge);
  }
  if (!isValid(json.token)) {
    debug("token error!", true);
    return response({ ok: false });
  }
  try {
    main(json.event);
  } catch (error) {
    debug(error, true);
  }
  return response({ ok: true });
}

// index.ts
globalThis.doPost = doPost;
