from flask import Flask, render_template, request, jsonify, send_from_directory
import random
import string
from datetime import datetime
import os

app = Flask(__name__)

# In-memory storage
password_history = []

def check_strength(password):
    score = 0
    length = len(password)
    
    if any(c.islower() for c in password): score += 1
    if any(c.isupper() for c in password): score += 1
    if any(c.isdigit() for c in password): score += 1
    if any(c in string.punctuation for c in password): score += 1
    if length >= 12: score += 2
    elif length >= 8: score += 1
    
    if score >= 6: return "Strong", "strong"
    elif score >= 4: return "Medium", "medium"
    return "Weak", "weak"

def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(random.choice(characters) for _ in range(length))
    return password

def generate_custom_password(name, symbol, number):
    name_part = "".join(c for c in name if c.isalnum()) or "User"
    symbol_part = symbol[0] if symbol and symbol.strip() else "@"
    num_part = "".join(c for c in number if c.isdigit())
    if len(num_part) != 4:
        num_part = str(random.randint(1000, 9999))
    return f"{name_part}{symbol_part}{num_part}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generator')
def generator():
    return render_template('generator.html', history=password_history)

# PWA Routes
@app.route('/manifest.json')
def manifest():
    return send_from_directory('static', 'manifest.json')

@app.route('/sw.js')
def sw():
    return send_from_directory('static', 'sw.js')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# API Routes
@app.route('/generate/random', methods=['POST'])
def generate_random():
    data = request.get_json()
    length = data.get('length', 12)
    password = generate_random_password(length)
    strength_label, strength_class = check_strength(password)
    return jsonify({
        'success': True,
        'password': password,
        'strength_label': strength_label,
        'strength_class': strength_class,
        'method': 'random'
    })

@app.route('/generate/custom', methods=['POST'])
def generate_custom():
    data = request.get_json()
    name = data.get('name', '')
    symbol = data.get('symbol', '')
    number = data.get('number', '')
    password = generate_custom_password(name, symbol, number)
    strength_label, strength_class = check_strength(password)
    return jsonify({
        'success': True,
        'password': password,
        'strength_label': strength_label,
        'strength_class': strength_class,
        'method': 'custom'
    })

@app.route('/save', methods=['POST'])
def save():
    data = request.get_json()
    password = data.get('password', '').strip()
    used_for = data.get('used_for', '').strip()
    method = data.get('method', 'custom')
    
    if not password:
        return jsonify({'success': False, 'message': 'Password is required'}), 400
    if not used_for:
        return jsonify({'success': False, 'message': 'Please specify where to use this password'}), 400
    
    strength_label, strength_class = check_strength(password)
    
    entry = {
        'id': len(password_history) + 1,
        'password': password,
        'used_for': used_for,
        'method': method,
        'strength_label': strength_label,
        'strength_class': strength_class,
        'created_at': datetime.now().strftime('%d %b %Y, %I:%M %p')
    }
    
    password_history.insert(0, entry)
    
    return jsonify({
        'success': True,
        'message': 'Password saved successfully!',
        'entry': entry
    })

@app.route('/delete/<int:password_id>', methods=['DELETE'])
def delete(password_id):
    global password_history
    password_history = [p for p in password_history if p['id'] != password_id]
    return jsonify({'success': True, 'message': 'Password deleted successfully'})

if __name__ == '__main__':
    print("=" * 50)
    print("🔐 SecurePass - PWA Ready Password Generator")
    print("=" * 50)
    print("📱 Server running at: http://localhost:5000")
    print("📲 To install as app:")
    print("   1. Open Chrome browser")
    print("   2. Go to http://localhost:5000")
    print("   3. Click the 'Install App' button that appears")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)