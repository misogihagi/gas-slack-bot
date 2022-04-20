const sheetURL = PropertiesService.getScriptProperties().getProperty(
	"SHEET_URL",
);

function today() {
	const today = new Date();
	return {
		thisYear: today.getUTCFullYear(),
		thisMonth: today.getUTCMonth() + 1,
		thisDate: today.getUTCDate(),
	};
}
function getBook() {
	return SpreadsheetApp.openByUrl(sheetURL);
}
function getSheet() {
	const { thisYear, thisMonth } = today();
	const sheetName = `${thisYear}年${thisMonth}月`;
	return getBook().getSheetByName(sheetName);
}

export function extract(text) {
	const expr = /[0-9][0-9]?:?[0-9][0-9]-[0-9][0-9]?:?[0-9][0-9]?/;
	return text.split("\n").find((e) => expr.test(e));
}

function initMonth() {
	const today = new Date();
	const thisYear = today.getUTCFullYear();
	const thisMonth = today.getUTCMonth() + 1;
	const book = SpreadsheetApp.openByUrl(sheetURL);

	const firstSheet = book.getSheetByName("2022年4月");
	if (firstSheet === null) {
		throw "template sheet not found!";
	}
	const sheetName = `${thisYear}年${thisMonth}月`;

	firstSheet.copyTo(book).setName(sheetName);
	const sheet = getSheet();
	sheet.getRange(4, 2).setValue(thisMonth);

	const daysCount = new Date(thisYear, thisMonth, 0).getUTCDate();
	if (daysCount > 30) {
		firstSheet.getRange(37, 1, 1, 12).copyTo(sheet.getRange(37, 1));
	}

	const data = [...Array(daysCount)].map(
		(_, i) => [
			[(i + 1).toString().padStart(2, "0"), thisMonth, thisYear].join("/"),
		],
	);
	sheet.getRange(8, 1, daysCount, 1).setValues(data);
}
//出社	退社	休憩開始1	休憩終了1	休憩開始２	休憩終了2	休憩開始3	休憩終了3
export function parse(str: string) {
	function theDay(time: number[]) {
		const { thisYear, thisMonth, thisDate } = today();
		return new Date(
			Date.UTC(thisYear, thisMonth - 1, thisDate, time[0], time[1]),
		);
	}

	return str.split(",").map(
		(duration) =>
			duration.split("-").map(
				(d) =>
					d.includes(":") ? theDay(d.split(":").map(Number)) : theDay(
						[d.slice(0, -2), d.slice(-2)].map(Number),
					),
			),
	);
}

export function main(e) {
	const { thisYear, thisMonth } = today();
	if (!getBook().getSheetByName(`${thisYear}年${thisMonth}月`)) {
		initMonth();
	}

	const sheet = getSheet();
	const val = (function transform(input) {
		const data = input.flatMap((e) => e).map((e) => e.getTime()).sort();
		return [data[0], data.slice(-1)[0], ...data.slice(1, -1)];
	})(parse(extract(e["text"])));

	function format(time) {
		return new Date(time).getUTCHours().toString().padStart(2, "0") +
		":" +
		new Date(time).getUTCMinutes().toString().padStart(2, "0");
	}
	sheet.getRange(8 + new Date().getUTCDate() - 1, 3, 1, 8).setValues([
		Array.from({ length: 8 }, (_, i) => val[i] ? format(val[i]) : null),
	]);
}
