function onEdit(e) {
  const sheet = e.range.getSheet();
  const editedRow = e.range.getRow();

  if (sheet.getName() !== "Master_sheet" || editedRow < 3) return;

  // Read headers from row 2 instead of row 1
  const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  console.log("Headers: " + headers.join(", "));

  const statusCol = headers.indexOf("Status") + 1;
  const confirmCol = headers.indexOf("Confirm Changes") + 1;
  const admissionNoCol = headers.indexOf("Admission No") + 1;
  console.log("statusCol: " + statusCol + ", confirmCol: " + confirmCol + ", admissionNoCol: " + admissionNoCol);

  const editedColumn = e.range.getColumn();
  if (editedColumn !== confirmCol) {
    console.log("Edited column " + editedColumn + " does not match confirmCol " + confirmCol);
    return;
  }

  const status = sheet.getRange(editedRow, statusCol).getValue();
  const confirm = sheet.getRange(editedRow, confirmCol).getValue();
  const admissionNo = sheet.getRange(editedRow, admissionNoCol).getValue();
  const rowData = sheet.getRange(editedRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  console.log("status: " + status + ", confirm: " + confirm + ", admissionNo: " + admissionNo);

  const tcStatuses = ["TC Applied", "TC Issued", "Long Absentee"];

  if (confirm.toLowerCase() === "yes") {
    if (tcStatuses.includes(status)) {
      console.log("Calling copyToTCSheet for row " + editedRow);
      copyToTCSheet(admissionNo, status, rowData, editedRow, headers);
    } else if (status === "Active") {
      console.log("Calling removeFromTCSheetIfExists for row " + editedRow);
      removeFromTCSheetIfExists(admissionNo, editedRow, confirmCol);
    }
  }
}

function copyToTCSheet(admissionNo, status, rowData, editedRow, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tcSheet = ss.getSheetByName("TC_Details");
  const logSheet = ss.getSheetByName("Logs");
  const masterSheet = ss.getSheetByName("Master_sheet");

  const existingTCs = tcSheet.getRange(2, 2, tcSheet.getLastRow() - 1, 1).getValues().flat();
  if (existingTCs.includes(admissionNo)) {
    masterSheet.getRange(editedRow, headers.indexOf("Confirm Changes") + 1).setValue("");
    ss.toast("⚠ Student already exists in TC_Details.", "Skipped", 4);
    return;
  }

  const columnsToCopy = [
    { label: "Student Name" },
    { label: "Grade" },
    { label: "Section" },
    { label: "Gender" },
    { label: "PEN" },
    { label: "APAAR" },
    { label: "Status" }
  ];

  const newRow = ["", admissionNo]; // S/N blank, then Admission No
  const missingFields = [];

  columnsToCopy.forEach(col => {
    const index = headers.indexOf(col.label);
    console.log("Column " + col.label + " index: " + index);
    const value = rowData[index];
    newRow.push(value);
    if (!value || value.toString().trim() === "") {
      missingFields.push(col.label);
    }
  });
  console.log("newRow: " + JSON.stringify(newRow));

  tcSheet.appendRow(newRow);

  logSheet.appendRow([
    new Date(),
    admissionNo,
    "Moved to TC_Details",
    status,
    missingFields.length ? `Missing: ${missingFields.join(", ")}` : "✓ All required fields available"
  ]);

  masterSheet.getRange(editedRow, headers.indexOf("Confirm Changes") + 1).setValue("");
  SpreadsheetApp.flush();
  ss.toast("✅ Student moved to TC_Details!", "Success", 4);
}

function removeFromTCSheetIfExists(admissionNo, editedRow, confirmCol) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tcSheet = ss.getSheetByName("TC_Details");
  const logSheet = ss.getSheetByName("Logs");
  const masterSheet = ss.getSheetByName("Master_sheet");

  const tcData = tcSheet.getDataRange().getValues();

  for (let i = 1; i < tcData.length; i++) {
    if (tcData[i][1] === admissionNo) { // Column B
      tcSheet.deleteRow(i + 1); // Adjust for 0-indexing
      logSheet.appendRow([
        new Date(),
        admissionNo,
        "Removed from TC_Details",
        "Reverted to Active",
        "-"
      ]);
      masterSheet.getRange(editedRow, confirmCol).setValue("");
      SpreadsheetApp.flush();
      ss.toast("❌ Student removed from TC_Details.", "Reverted", 4);
      return;
    }
  }
}