# Inventory Tracking Application

This is an inventory tracking application that uses a Python backend with JSON file storage to enable true multi-user functionality.

## Features

- Inventory tracking for different categories (Age, Income, Milk Type)
- Transaction history recording
- Data persistence using JSON files
- True multi-user support - all users see the same data
- Responsive design that works on desktop and mobile devices

## How It Works

This application uses a Python backend with JSON file storage:
1. All inventory and transaction data is stored in a JSON file on the server
2. A Python HTTP server handles all data operations and calculations
3. All users access the same data file, ensuring consistency

## Prerequisites

1. Python 3.0 or higher (you have Python 3.13.7 which is perfect)

## Setting Up the Application

### Running the Application

1. Open a terminal/command prompt in the project directory

2. Start the server:
   ```
   python server.py
   ```
   
   Or double-click on `start-server.bat`

3. Access the application in your web browser at:
   ```
   http://localhost:8000
   ```

## Using the Application

1. **Viewing Inventory:**
   - The main inventory table shows all categories with their total and remaining quantities
   - Data is loaded from the server

2. **Recording Consumption:**
   - Select one or more categories by clicking on them
   - Add optional notes in the text area
   - Click "تسجيل الاستهلاك" (Record Consumption)
   - The data is saved to the server and is immediately visible to all users

3. **Viewing Transaction History:**
   - All transactions are displayed in the history table
   - Transactions are loaded from the server

4. **Deleting Transactions:**
   - Click the "حذف" (Delete) button next to any transaction group
   - The deletion is applied to the server data

5. **Refreshing Data:**
   - Click the "تحديث البيانات" (Refresh Data) button to reload data from the server

## Multi-user Support

This application provides true multi-user support:
- All users access the same data file on the server
- Changes made by one user are immediately visible to all other users
- No data conflicts or synchronization issues

## Data Storage

- Data is stored in a file named `data.json` in the project directory
- This file is automatically created when the application is first accessed
- The file contains all inventory and transaction data

## API Endpoints

- `GET /api/data` - Retrieve all inventory and transaction data
- `POST /api/transactions` - Record new transactions
- `DELETE /api/transactions/{timestamp}` - Delete transactions by timestamp

## Troubleshooting

1. **Port already in use:**
   - If port 8000 is already in use, you can change it in `server.py`

2. **Permission errors:**
   - Make sure you have write permissions in the project directory

3. **Data not loading:**
   - Check that the Python server is running
   - Verify the `data.json` file exists and is readable
   - Check the terminal for error messages

4. **Data not updating:**
   - Click the "تحديث البيانات" button to force a refresh
   - Check that the `data.json` file is being updated

## Technical Details

- The application uses a Python HTTP server with JSON file storage
- All data operations are handled by the server-side Python application
- The frontend communicates with the backend through HTTP requests
- Data validation and calculations are performed by the Python server
- The application automatically recalculates inventory quantities based on transaction history