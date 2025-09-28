function onEdit(e) {
  // This function runs automatically when any cell is edited
  
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  
  // Only run if editing the active sheet and in the transaction table area
  if (range.getRow() > 12 && range.getColumn() <= 2) {
    updateRemainingQuantities();
  }
}

function updateRemainingQuantities() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  // Get all inventory data (rows 2-9)
  var inventoryData = sheet.getRange("A2:B9").getValues();
  var inventoryCategories = {};
  
  // Create map of categories and their row positions
  for (var i = 0; i < inventoryData.length; i++) {
    var category = inventoryData[i][0];
    if (category) {
      inventoryCategories[category] = i + 2; // +2 because we start at row 2
    }
  }
  
  // Get all transaction data (rows 13 onwards)
  var lastRow = sheet.getLastRow();
  if (lastRow < 13) return; // No transactions yet
  
  var transactionData = sheet.getRange("A13:B" + lastRow).getValues();
  
  // Create a map to store total consumed quantities by category
  var consumptionMap = {};
  
  // Process transactions
  for (var i = 0; i < transactionData.length; i++) {
    var row = transactionData[i];
    var category = row[0]; // Column A
    var quantity = row[1]; // Column B
    
    // Skip empty rows
    if (category && typeof quantity === 'number' && quantity > 0) {
      if (consumptionMap[category]) {
        consumptionMap[category] += quantity;
      } else {
        consumptionMap[category] = quantity;
      }
    }
  }
  
  // Update inventory sheet with remaining quantities
  for (var category in inventoryCategories) {
    var row = inventoryCategories[category];
    var totalQuantity = sheet.getRange(row, 2).getValue(); // Column B
    
    // Calculate remaining quantity
    var consumedQuantity = consumptionMap[category] || 0;
    var remainingQuantity = totalQuantity - consumedQuantity;
    
    // Update the remaining quantity column (Column C)
    sheet.getRange(row, 3).setValue(remainingQuantity);
  }
}

function initializeSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  sheet.clear();
  
  // Set up Inventory section
  sheet.getRange("A1:C1").setValues([["Category", "Total Quantity", "Remaining"]]);
  
  // Sample inventory data
  sheet.getRange("A2:C9").setValues([
    ["العمر 20-29", 20, 20],
    ["العمر 30-40", 30, 30],
    ["الدخل 401-500 (C2)", 60, 60],
    ["الدخل 501-600 (C1)", 41, 41],
    ["الدخل 601+ (A&B)", 48, 48],
    ["نيدو", 90, 90],
    ["حليبنا", 29, 29],
    ["إنجوي", 29, 29]
  ]);
  
  // Add some spacing
  sheet.getRange("A10").setValue(""); // Blank row
  sheet.getRange("A11").setValue(""); // Blank row
  
  // Set up Transactions section
  sheet.getRange("A12:B12").setValues([["Category", "Consumed Quantity"]]);
  
  // Format headers
  sheet.getRange("A1:C1").setFontWeight("bold");
  sheet.getRange("A12:B12").setFontWeight("bold");
  
  // Set column widths
  sheet.setColumnWidth(1, 200); // Category column
  sheet.setColumnWidth(2, 150); // Quantity column
  sheet.setColumnWidth(3, 150); // Remaining column
  
  SpreadsheetApp.getUi().alert("Sheet initialized with inventory and transaction tables!");
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Inventory System')
      .addItem('Initialize Sheet', 'initializeSheet')
      .addToUi();
}