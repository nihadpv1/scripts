/**
 * Script for importing from external Google Sheet to current Google Sheet based on the columns.
 * Version: 1.0
 * Author: [Your Name]
 * Date: 2025-04-09
 */


function importNewAdmissions() {
  const sourceSheetId = "1M6mdFL8ZSJuAxqZl3XgI-kVpnrEtS0II3a5ygS2n-Z8";
  const sourceSheetName = "ADMISSION 2025-26";
  const targetSheetName = "Master_sheet";
  const logSheetName = "Logs";
  const startRow = 740;
  const COLUMN_COUNT = 28;

  const sourceSheet = SpreadsheetApp.openById(sourceSheetId).getSheetByName(sourceSheetName);
  const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(targetSheetName);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(logSheetName);

  if (!logSheet) {
    throw new Error(`Log sheet "${logSheetName}" not found.`);
  }

  const sourceData = sourceSheet.getRange(2, 1, sourceSheet.getLastRow() - 1, 22).getValues();
  const lastRow = targetSheet.getLastRow();
  const checkRange = targetSheet.getRange(startRow, 3, lastRow - startRow + 1, 1).getValues();
  const existingAdmissionNos = checkRange.map(row => row[0]);

  const existingLogs = logSheet.getDataRange().getValues().slice(1).map(row => row.slice(0, 4).join("|"));

  const rowsToAppend = [];
  const incompleteRows = [];
  const logEntries = [];
  const importedAdmissions = [];
  const seenAdmissionNos = new Set();

  for (let rowIndex = 0; rowIndex < sourceData.length; rowIndex++) {
    const row = sourceData[rowIndex];
    const admissionNo = row[2];
    const sourceRowIndex = rowIndex + 2;

    if (!admissionNo) {
      const missingFields = ["Admission No"];
      incompleteRows.push({ admissionNo: "(Missing)", missingFields, sourceRow: sourceRowIndex });
      logEntries.push(["(Missing)", "Skipped", "Pending", `Admission No (Source Row ${sourceRowIndex})`]);
      continue;
    }

    if (seenAdmissionNos.has(admissionNo)) {
      const logKey = [admissionNo, "Skipped", "Duplicate in source"].join("|");
      if (!existingLogs.includes(logKey)) {
        logEntries.push([admissionNo, "Skipped", "Duplicate in source", `Source Row ${sourceRowIndex}`]);
      }
      continue;
    }
    seenAdmissionNos.add(admissionNo);

    const existingIndex = existingAdmissionNos.indexOf(admissionNo);
    let allowUpdate = false;
    let pasteRow = null;
    let actionType = "New";

    if (existingIndex !== -1) {
      const targetRow = startRow + existingIndex;
      const status = targetSheet.getRange(targetRow, 23).getValue(); // W: Status
      if (status === "Pending") {
        targetSheet.deleteRow(targetRow);
        existingAdmissionNos.splice(existingIndex, 1);
        pasteRow = targetRow;
        allowUpdate = true;
        actionType = "Re-imported";
      } else {
        continue;
      }
    }

    const studentRow = [];
    studentRow[0] = "";                     // A: S/N (Auto)
    studentRow[1] = "";                     // B: Academic
    studentRow[2] = row[2];                 // C: Admission No
    studentRow[3] = row[3].toUpperCase();   // D: Student Name (UPPER)
    studentRow[4] = "";                     // E: Grade
    studentRow[5] = "";                     // F: Section
    studentRow[6] = row[8];                 // G: Gender
    studentRow[7] = row[10].toUpperCase();  // H: Father Name (UPPER)
    studentRow[8] = row[11].toUpperCase();  // I: Mother Name (UPPER)
    studentRow[9] = row[12];                   // J: Phone Number (Ref)
    studentRow[10] = "";                       // K: Primary Phone
    studentRow[11] = "";                    // L: Secondary Phone
    studentRow[12] = "";                    // M: Student Email
    studentRow[13] = row[14];               // N: Parent Email
    studentRow[14] = "";                    // O: Blood Group
    studentRow[15] = row[9];                // P: DOB
    studentRow[16] = toProper(row[21]);     // Q: Address (Proper)
    studentRow[17] = "";                    // R: PEN
    studentRow[18] = "";                    // S: APAAR
    studentRow[19] = "";                    // T: Status (will fill later)
    studentRow[20] = row[7];                // U: RAW Academics
    studentRow[21] = "";                    // V: RAW Grade
    studentRow[22] = "";                    // W: RAW Section
    studentRow[23] = "";                    // X: Confirm Changes
    studentRow[24] = toProper(row[4]);      // Y: Religion (Proper)
    studentRow[25] = toProper(row[5]);      // Z: Community (Proper)
    studentRow[26] = toProper(row[6]);      // AA: Category (Proper)
    studentRow[27] = row[17];               // AB: Aadhaar No

    const requiredIndexes = {
      "Admission No": 2,
      "Student Name": 3,
      "Gender": 6,
      "Father Name": 7,
      "Mother Name": 8,
      "Phone Number (Ref)": 9,
      "Parent Email": 13,
      "DOB": 15,
      "Address": 16,
      "RAW Academics": 20,
    };

    const missingFields = Object.entries(requiredIndexes)
      .filter(([_, i]) => !studentRow[i])
      .map(([field]) => field);

    const status = missingFields.length > 0 ? "Pending" : "Active";
    studentRow[19] = status;

    if (status === "Pending") {
      incompleteRows.push({ admissionNo, missingFields, sourceRow: sourceRowIndex });
      logEntries.push([admissionNo, actionType, status, `${missingFields.join(", ")} (Row ${sourceRowIndex})`]);
      continue;
    }

    rowsToAppend.push({ row: studentRow, pasteRow });
    importedAdmissions.push(admissionNo);
    logEntries.push([admissionNo, actionType, status, pasteRow ? `Pasted at Row ${pasteRow}` : "Appended"]);
  }

  if (rowsToAppend.length > 0) {
    let pasteRow = startRow;
    for (let item of rowsToAppend) {
      try {
        if (item.pasteRow) {
          targetSheet.getRange(item.pasteRow, 1, 1, COLUMN_COUNT).setValues([item.row]);
        } else {
          while (targetSheet.getRange(pasteRow, 3).getValue()) {
            pasteRow++;
          }
          targetSheet.getRange(pasteRow, 1, 1, COLUMN_COUNT).setValues([item.row]);
        }
      } catch (error) {
        logEntries.push([item.row[2], item.pasteRow ? "Re-imported" : "New", "Failed", error.message]);
      }
    }
  }

  const finalLogs = logEntries.filter(entry => {
    const key = entry.slice(0, 3).join("|");
    return !existingLogs.includes(key);
  });

  if (finalLogs.length > 0) {
    const now = new Date();
    const valuesWithTimestamp = finalLogs.map(e => [now, ...e]);
    const logStartRow = logSheet.getLastRow() + 1;
    logSheet.getRange(logStartRow, 1, valuesWithTimestamp.length, 5).setValues(valuesWithTimestamp);
  }

  if (incompleteRows.length > 0) {
    const emailBody = incompleteRows.map(r => {
      const rowNote = r.sourceRow ? ` (Row ${r.sourceRow})` : "";
      return `• Admission No: ${r.admissionNo}${rowNote}\n   Missing: ${r.missingFields.join(", ")}`;
    }).join("\n\n");

    MailApp.sendEmail({
      to: "nihad@oxfordcalicut.com",
      subject: "⚠️ Incomplete Student Data Found During Import",
      body: `The following student records were skipped due to missing fields:\n\n${emailBody}\n\nThey will be reprocessed automatically once data is complete.`
    });
  }

  if (importedAdmissions.length > 0) {
    Logger.log(`✅ Imported Students (${importedAdmissions.length}): ${importedAdmissions.join(", ")}`);
  }

  if (incompleteRows.length > 0) {
    const skippedList = incompleteRows.map(row => row.admissionNo + (row.sourceRow ? ` (Row ${row.sourceRow})` : ""));
    Logger.log(`⏭️ Incomplete Students (${skippedList.length}): ${skippedList.join(", ")}`);
  }

  if (rowsToAppend.length === 0 && incompleteRows.length === 0) {
    Logger.log("📭 No new student records to import.");
  }
}

function toProper(text) {
  if (!text || typeof text !== "string") return "";
  return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}
