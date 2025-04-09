# TC Move Google Apps Scripts

This folder contains Google Apps Scripts used for moving student records to the Transfer Certificate (TC) sheet.

## Scripts

### 1. tc_move_on_edit_based_on_index_numbers.gs
- **Purpose**: Automatically moves a student record from the main sheet to the TC sheet based on index number.
- **Notes**: Triggered on edit, relies on unique index numbers to identify and move rows accurately.

### 2. tc_move_on_edit_based_on_headers.gs
- **Purpose**: Updated version of the TC mover script. Uses header names instead of fixed column indexes to allow more flexibility and accuracy in identifying data.
- **Notes**: Reflects structural changes in the student sheet for easier future updates.

## Versioning
- `tc_move_on_edit_based_on_index_numbers.gs` → Tagged as `tcmove-v1.0`
- `tc_move_on_edit_based_on_headers.gs` → Tagged as `tcmove-v2.0` (planned or already done)
