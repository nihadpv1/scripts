function onEdit(e) {
  const sheet = e.range.getSheet();
  const editedColumn = e.range.getColumn();
  const editedRow = e.range.getRow();


  if (sheet.getName() === "Master_sheet" && editedColumn === 23 && editedRow >= 3) {
    const admissionNo = sheet.getRange(editedRow, 3).getValue(); // Column C
    const status = sheet.getRange(editedRow, 23).getValue(); // Column W


    const row = sheet.getRange(editedRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    const tcStatuses = ["TC Issued", "TC Applied", "Long Absentee"];


    if (tcStatuses.includes(status)) {
      copyToTCSheet(admissionNo, status, row);
    } else if (status === "Active") {
      removeFromTCSheetIfExists(admissionNo);
    }
  }
}


function copyToTCSheet(admissionNo, status, rowData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tcSheet = ss.getSheetByName("TC_Details");
  const logSheet = ss.getSheetByName("Logs");


  const lastRow = tcSheet.getLastRow();
  const existingTCs = lastRow >= 3
    ? tcSheet.getRange(3, 2, lastRow - 2, 1).getValues().flat()
    : [];


  if (existingTCs.includes(admissionNo)) {
    Logger.log(`Admission No ${admissionNo} already exists in TC_Details`);
    return;
  }


  // Extract specific fields only
  const newRow = [
    "",                  // S/N
    rowData[2],          // Admission No (C)
    rowData[4],          // Student Name
    rowData[5],          // Grade
    rowData[6],          // Section
    rowData[7],          // Gender
    rowData[20],         // PEN
    rowData[21],         // APAAR
    rowData[22],         // Status
    "",                  // TC Issue Date (Empty)
    ""                   // Reason for TC (Empty)
  ];


  const insertRow = lastRow + 1;
  tcSheet.getRange(insertRow, 1, 1, newRow.length).setValues([newRow]);


  // Log the action
  logSheet.appendRow([
    new Date(),
    admissionNo,
    "Moved to TC_Details",
    status,
    Session.getActiveUser().getEmail() || "System"
  ]);
}


function removeFromTCSheetIfExists(admissionNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tcSheet = ss.getSheetByName("TC_Details");
  const logSheet = ss.getSheetByName("Logs");


  const lastRow = tcSheet.getLastRow();
  if (lastRow < 3) return;


  const data = tcSheet.getRange(3, 2, lastRow - 2).getValues().flat(); // Column B


  for (let i = 0; i < data.length; i++) {
    if (data[i] === admissionNo) {
      const rowToDelete = i + 3;
      tcSheet.deleteRow(rowToDelete);


      logSheet.appendRow([
        new Date(),
        admissionNo,
        "Removed from TC_Details",
        "Status Reverted",
        Session.getActiveUser().getEmail() || "System"
      ]);
      break;
    }
  }
}
