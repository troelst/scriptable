// Initial script made by Marcus Mattsson
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: user-md;
const apiKey = ""

const widget = new ListWidget()

widget.addSpacer()

// Fetch SSI website code
let url = "https://covid19.ssi.dk/overvagningsdata/download-fil-med-overvaagningdata"
let request = new Request(url)
const html = await request.loadString()

// Find the URL to the latest data
// Example: https://files.ssi.dk/Data-epidemiologisk-rapport-23102020-2nix
let regEx = new RegExp('https://files.ssi.dk/covid19/overvagning/data/data-.*?(?=")')
const reportUrl = html.match(regEx)[0]

// Fetch data package (zip files of CSV's)
request = new Request(reportUrl)
const reportData = await request.load()

// Unzip
url = "https://v2.convertapi.com/convert/zip/to/extract?Secret=" + apiKey + "&StoreFile=true"
request = new Request(url)
request.method = "POST"
request.addFileDataToMultipart(reportData, "application/zip", "File", "rt.zip")
const extractionJson = await request.loadJSON()

// Find CSV file for contact number report
// (this script uses the contact number calculated by number of confirmed cases.
// There's also a CSV with contact number calculated for patienst admitted)
let rtCsvUrl = null
for (entry of extractionJson.Files) {
  if (entry.FileName.includes("Municipality_cases_")) {
    rtCsvUrl = entry.Url
    break
  }
}

if (rtCsvUrl == null) {
  console.log("Did not find CSV URL!")
  return
}

// Download CSV report
request = new Request(rtCsvUrl)
const rtCsv = await request.loadString()

// Split document into array with one line per index
let lines = rtCsv.split(/\r?\n/)

// Last line is always empty, so find the last line that has text
var latestEntryLine = ""
while (latestEntryLine.length == 0) {
  latestEntryLine = lines.pop()
}

// Turn CSV line into array of elementes
const latest = latestEntryLine.split(";")

if (latest.length < 2) {
  // todo show error
  return
}

const dateString = latest[0]
latest.shift()
const cases = latest.map(Number)
const casesSum = cases.reduce((a, b) => a + b).toLocaleString()

const date = new Date(dateString)
const formatter = new DateFormatter()
formatter.useMediumDateStyle()
const formattedDate = formatter.string(date)

const emojiW = widget.addText("🦠")
emojiW.centerAlignText()
emojiW.font = Font.systemFont(14)

widget.addSpacer(4)

const headingW = widget.addText("Cases")
headingW.centerAlignText()
headingW.font = Font.systemFont(12)
headingW.textColor = Color.lightGray()

widget.addSpacer(4)

const casesSumW = widget.addText(casesSum)
casesSumW.centerAlignText()
casesSumW.font = Font.systemFont(26)

widget.addSpacer(4)

const dateW = widget.addText(formattedDate)
dateW.centerAlignText()
dateW.font = Font.systemFont(12)
dateW.textColor = Color.lightGray()

widget.addSpacer()

widget.presentSmall()
