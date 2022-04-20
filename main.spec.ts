let ssdata = [[]];

const range = jest.fn(
	() => ({
		getRange: jest.fn(
			() => ({
				getValue: jest.fn(() => {
					"";
				}),
				getValues: jest.fn(() => [[""]]),
				setValues: jest.fn((val) => {
					ssdata = val;
				}),
			}),
		),
	}),
);

const sheet = jest.fn(() => ({ getSheetByName: range, getActiveSheet: range }));

SpreadsheetApp = { getActiveSpreadsheet: sheet, openByUrl: sheet } as any;

PropertiesService =
	{
		getScriptProperties: jest.fn(() => ({ getProperty: jest.fn((s) => ("")) })),
	} as any;

import { extract, parse, main } from "./main";

function theDay(time) {
	const today = new Date();
	return new Date(
		Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), time),
	);
}

const src = [
	"09:00-12:00",
	"09:00-12:00,13:00-16:00",
	"0900-1200",
	"0900-1200,1300-1600",
	"9:00-12:00",
	"9:00-12:00,13:00-16:00",
	"900-1200",
	"900-1200,1300-1600",
];
const exp = [
	[[9, 12]],
	[[9, 16], [12, 13]],
	[[9, 12]],
	[[9, 16], [12, 13]],
	[[9, 12]],
	[[9, 16], [12, 13]],
	[[9, 12]],
	[[9, 16], [12, 13]],
].map((f) => f.map((s) => s.map(theDay)));

it(
	"extract",
	() => {
		src.forEach(
			(s) => {
				expect(extract("<@U03BXXXXXX>\n" + s + "\ntoday")).toBe(s);
			},
		);
	},
);

it(
	"parse",
	() => {
		for (let i = 0; i < src.length; i++) {
			const e = exp[i]
				.flat()
				.sort((a, b) => a.getTime() - b.getTime())
				.reduce(
					(acc, cur) => {
						if (acc.slice(-1)[0].length > 1) {
							acc.push([cur]);
						} else {
							acc.slice(-1)[0].push(cur);
						}
						return acc;
					},
					[[]],
				);
			console.log(exp[i].flat().sort((a, b) => a.getTime() - b.getTime()));
			expect(parse(src[i])).toEqual(e);
		}
	},
);

it(
	"main",
	() => {
		const testArg = {
			"client_msg_id": "03XXXXXX-YYYY-ZZZZ-AAAA-BBBBBBBBBBBB",
			"type": "app_mention",
			"text": "<@U03BXXXXXX>\n09:00-18:00\ntoday's message",
			"user": "U03YYYYYY",
			"ts": "1649915621.237889",
			"team": "T03ZZZZZZ",
		};
		main(testArg);
		expect(ssdata[0][0]).toBe("09:00");
		expect(ssdata[0][1]).toBe("18:00");
	},
);
