from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import User
from app import db
import logging

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            logging.warning(f"Missing credentials - email: {bool(email)}, password: {bool(password)}")
            if request.is_json:
                return jsonify({'success': False, 'message': 'Email and password are required'})
            flash('Email and password are required', 'error')
            return render_template('auth.html')
            
        logging.info(f"Login attempt for email: {email}")
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            logging.info(f"User found: {user.username} ({user.email})")
            logging.info(f"Received password: {password}")
            logging.info(f"Stored hash: {user.password_hash[:50]}...")
            
            password_valid = check_password_hash(user.password_hash, password)
            logging.info(f"Password verification result: {password_valid}")
            
            if password_valid:
                login_user(user)
                logging.info(f"User {user.email} logged in successfully")
                
                if request.is_json:
                    return jsonify({'success': True, 'redirect': url_for('dashboard')})
                
                next_page = request.args.get('next')
                return redirect(next_page) if next_page else redirect(url_for('dashboard'))
            else:
                logging.warning(f"Password check failed for email: {email}")
                logging.warning(f"Password hash starts with: {user.password_hash[:30]}")
        else:
            logging.warning(f"User not found for email: {email}")
        
        logging.warning(f"Failed login attempt for email: {email}")
        if request.is_json:
            return jsonify({'success': False, 'message': 'Email atau password salah'})
        flash('Email atau password salah', 'error')
    
    return render_template('auth.html')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() if request.is_json else request.form
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not all([username, email, password]):
        if request.is_json:
            return jsonify({'success': False, 'message': 'All fields are required'})
        flash('All fields are required', 'error')
        return render_template('auth.html')
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        if request.is_json:
            return jsonify({'success': False, 'message': 'Email already registered'})
        flash('Email already registered', 'error')
        return render_template('auth.html')
    
    if User.query.filter_by(username=username).first():
        if request.is_json:
            return jsonify({'success': False, 'message': 'Username already taken'})
        flash('Username already taken', 'error')
        return render_template('auth.html')
    
    # Create new user
    password_hash = generate_password_hash(password)
    new_user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        subscription_type='free',
        max_devices=1
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user)
        logging.info(f"New user registered: {email}")
        
        if request.is_json:
            return jsonify({'success': True, 'redirect': url_for('dashboard')})
        
        flash('Registration successful! Welcome to AniFlix!', 'success')
        return redirect(url_for('dashboard'))
    except Exception as e:
        logging.error(f"Registration error: {e}")
        db.session.rollback()
        if request.is_json:
            return jsonify({'success': False, 'message': 'Registration failed. Please try again.'})
        flash('Registration failed. Please try again.', 'error')
        return render_template('auth.html')

@auth_bp.route('/logout')
@login_required
def logout():
    # Decrease device count when logging out
    if current_user.devices_count > 0:
        current_user.devices_count -= 1
        db.session.commit()
    logout_user()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('index'))

@auth_bp.route('/generate-barcode')
@login_required
def generate_barcode():
    """Generate barcode for device login"""
    import qrcode
    import io
    import base64
    import secrets
    import json
    from datetime import datetime
    
    # Create a unique token for this user
    login_token = secrets.token_urlsafe(32)
    
    # Store token data
    barcode_data = {
        'user_id': current_user.id,
        'token': login_token,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Generate QR code (acts as barcode)
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(json.dumps(barcode_data))
    qr.make(fit=True)
    
    # Create barcode image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64 for display
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return jsonify({
        'success': True,
        'qr_image': f"data:image/png;base64,{img_str}",
        'token': login_token
    })

@auth_bp.route('/barcode-login', methods=['POST'])
def barcode_login():
    """Handle barcode login"""
    import json
    from datetime import datetime
    
    try:
        data = request.get_json()
        barcode_data = json.loads(data['barcode_data'])
        device_info = data.get('device_info', {})
        
        user_id = barcode_data.get('user_id')
        token = barcode_data.get('token')
        
        if not user_id or not token:
            return jsonify({'success': False, 'message': 'Invalid barcode'})
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'})
        
        # Check device limits
        if user.devices_count >= user.max_devices:
            return jsonify({
                'success': False, 
                'message': f'Device limit reached ({user.max_devices} devices max)'
            })
        
        # Update device count and login
        user.devices_count += 1
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Log in the user
        login_user(user, remember=True)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'redirect': url_for('dashboard')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Error processing barcode'
        })

@auth_bp.route('/remove-device', methods=['POST'])
@login_required
def remove_device():
    """Remove a device from user's account"""
    if current_user.devices_count > 0:
        current_user.devices_count -= 1
        db.session.commit()
        flash('Device removed successfully', 'success')
    else:
        flash('No devices to remove', 'error')
    
    return redirect(url_for('dashboard'))
