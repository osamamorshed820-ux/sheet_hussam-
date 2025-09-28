from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import urllib.parse
from datetime import datetime

# Data file path
DATA_FILE = 'data.json'

# Initialize data file if it doesn't exist
def initialize_data_file():
    if not os.path.exists(DATA_FILE):
        initial_data = {
            "inventory": [
                {"category": "العمر 20-29", "total": 20, "remaining": 20},
                {"category": "العمر 30-40", "total": 30, "remaining": 30},
                {"category": "الدخل 401-500 (C2)", "total": 60, "remaining": 60},
                {"category": "الدخل 501-600 (C1)", "total": 41, "remaining": 41},
                {"category": "الدخل 601+ (A&B)", "total": 48, "remaining": 48},
                {"category": "نيدو", "total": 90, "remaining": 90},
                {"category": "حليبنا", "total": 29, "remaining": 29},
                {"category": "إنجوي", "total": 29, "remaining": 29}
            ],
            "transactions": [],
            "lastUpdated": datetime.now().isoformat()
        }
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(initial_data, f, ensure_ascii=False, indent=2)

# Read data from file
def read_data():
    initialize_data_file()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading data: {e}")
        return {"inventory": [], "transactions": [], "lastUpdated": datetime.now().isoformat()}

# Write data to file
def write_data(data):
    try:
        data["lastUpdated"] = datetime.now().isoformat()
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error writing data: {e}")
        return False

# Validate inventory to ensure remaining <= total
def validate_inventory(inventory):
    for item in inventory:
        if item["remaining"] > item["total"]:
            item["remaining"] = item["total"]
        if item["remaining"] < 0:
            item["remaining"] = 0
    return inventory

# Recalculate remaining quantities based on transactions
def recalculate_remaining_quantities(inventory, transactions):
    # Reset all remaining quantities to their total values
    inventory_with_reset = []
    for item in inventory:
        inventory_with_reset.append({
            "category": item["category"],
            "total": item["total"],
            "remaining": item["total"]
        })
    
    # Subtract quantities based on transactions
    for transaction in transactions:
        for item in inventory_with_reset:
            if item["category"] == transaction["category"]:
                item["remaining"] = max(0, item["remaining"] - 1)
    
    return inventory_with_reset

# Custom request handler
class RequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/data':
            # Get all data
            try:
                data = read_data()
                # Recalculate remaining quantities to ensure accuracy
                data["inventory"] = recalculate_remaining_quantities(data["inventory"], data["transactions"])
                data["inventory"] = validate_inventory(data["inventory"])
                write_data(data)  # Save the recalculated data
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_error(500, f"Failed to retrieve data: {str(e)}")
        else:
            # Serve static files
            super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/transactions':
            try:
                # Get the content length
                content_length = int(self.headers['Content-Length'])
                # Read the POST data
                post_data = self.rfile.read(content_length)
                # Parse JSON data
                data_json = json.loads(post_data.decode('utf-8'))
                
                categories = data_json.get('categories', [])
                notes = data_json.get('notes', '')
                
                # Validate input
                if not categories:
                    self.send_error(400, "Categories are required")
                    return
                
                # Read current data
                data = read_data()
                
                # Add transactions for each category
                timestamp = datetime.now().isoformat()
                for category in categories:
                    transaction = {
                        "category": category,
                        "notes": notes,
                        "timestamp": timestamp
                    }
                    data["transactions"].append(transaction)
                
                # Recalculate remaining quantities
                data["inventory"] = recalculate_remaining_quantities(data["inventory"], data["transactions"])
                data["inventory"] = validate_inventory(data["inventory"])
                
                # Save updated data
                if write_data(data):
                    response = {"message": "Transaction recorded successfully", "data": data}
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_error(500, "Failed to save transaction")
            except Exception as e:
                self.send_error(500, f"Failed to record transaction: {str(e)}")
        else:
            self.send_error(404)
    
    def do_DELETE(self):
        if self.path.startswith('/api/transactions/'):
            try:
                # Extract timestamp from URL
                timestamp = urllib.parse.unquote(self.path.split('/')[-1])
                
                # Read current data
                data = read_data()
                
                # Find and remove transactions with this timestamp
                transactions_to_remove = [t for t in data["transactions"] if t["timestamp"] == timestamp]
                data["transactions"] = [t for t in data["transactions"] if t["timestamp"] != timestamp]
                
                # Recalculate remaining quantities
                data["inventory"] = recalculate_remaining_quantities(data["inventory"], data["transactions"])
                data["inventory"] = validate_inventory(data["inventory"])
                
                # Save updated data
                if write_data(data):
                    response = {
                        "message": "Transaction deleted successfully",
                        "removedTransactions": len(transactions_to_remove)
                    }
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_error(500, "Failed to delete transaction")
            except Exception as e:
                self.send_error(500, f"Failed to delete transaction: {str(e)}")
        else:
            self.send_error(404)
    
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Start the server
if __name__ == '__main__':
    initialize_data_file()
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"Server is running on http://localhost:{port}")
    print(f"Access the application at http://localhost:{port}")
    httpd.serve_forever()