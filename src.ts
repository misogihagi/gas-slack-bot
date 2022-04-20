import { main } from "./main";

function debug(messgae: string, isErr: boolean = false): void {
	const sheet = SpreadsheetApp.getActiveSheet();
	const lastRow = sheet.getLastRow();
	if (isErr) {
		const lastColumn = sheet.getRange(lastRow, 1).getLastColumn();
		sheet.getRange(lastRow, lastColumn + 1).setValue(messgae);
	} else {
		sheet.getRange(lastRow + 1, 1).setValue(messgae);
	}
}

type ParseResponse = { result: { [key: string]: any }, isErr: boolean };

function parse(str): ParseResponse {
	try {
		const json = JSON.parse(str);
		return { result: json, isErr: false };
	} catch (error) {
		return { result: {}, isErr: true };
	}
}

function response(obj): GoogleAppsScript.Content.TextOutput {
	return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
		ContentService.MimeType.JSON,
	);
}

function isValid(token): boolean {
	return PropertiesService.getScriptProperties().getProperty(
		"VERIFICATION_TOKEN",
	) == token;
}

export function doPost(e) {
	const s = e.postData.getDataAsString();
	debug(s);

	const parseResponse = parse(s);
	if (parseResponse.isErr) {
		debug("parse error!", true);
		return response({ ok: false });
	}
	const json = parseResponse.result;

	// for first slack verification
	if (json.type === "url_verification") {
		PropertiesService.getScriptProperties().setProperty(
			"VERIFICATION_TOKEN",
			json.token,
		);
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
