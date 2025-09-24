#!/usr/bin/env python3
"""
Enhanced ETD Python Desktop Application

This application provides a desktop interface for the ETD system with enhanced
biometric device integration, comprehensive logging, and retry logic.
"""

import sys
import os
import tkinter as tk
from tkinter import ttk, messagebox
import threading
import json
import requests
import ssl
from datetime import datetime
from typing import Optional, Dict, Any
import logging

# Configure enhanced logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
    handlers=[
        logging.FileHandler('etd_enhanced_app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Import enhanced biometric device
from enhanced_biometric_device import EnhancedBiometricDevice

class EnhancedLoginScreen:
    """Enhanced login screen with better error handling"""
    
    def __init__(self, parent, on_login_success):
        self.parent = parent
        self.on_login_success = on_login_success
        self.frame = ttk.Frame(parent)
        self.logger = logging.getLogger(__name__)
        self.setup_ui()
    
    def setup_ui(self):
        """Setup the enhanced login UI"""
        # Main container
        main_frame = ttk.Frame(self.frame)
        main_frame.pack(expand=True, fill='both', padx=50, pady=50)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="ETD Enhanced Application", 
            font=('Arial', 24, 'bold')
        )
        title_label.pack(pady=(0, 30))
        
        # Login form
        form_frame = ttk.Frame(main_frame)
        form_frame.pack(expand=True)
        
        # Email field
        ttk.Label(form_frame, text="Email:").pack(anchor='w')
        self.email_var = tk.StringVar()
        email_entry = ttk.Entry(form_frame, textvariable=self.email_var, width=30)
        email_entry.pack(pady=(0, 15))
        
        # Password field
        ttk.Label(form_frame, text="Password:").pack(anchor='w')
        self.password_var = tk.StringVar()
        password_entry = ttk.Entry(form_frame, textvariable=self.password_var, show='*', width=30)
        password_entry.pack(pady=(0, 20))
        
        # Login button
        login_btn = ttk.Button(
            form_frame, 
            text="Login", 
            command=self.handle_login,
            style='Accent.TButton'
        )
        login_btn.pack(pady=(0, 10))
        
        # Status label
        self.status_label = ttk.Label(form_frame, text="", foreground='red')
        self.status_label.pack()
        
        # Bind Enter key to login
        email_entry.bind('<Return>', lambda e: self.handle_login())
        password_entry.bind('<Return>', lambda e: self.handle_login())
    
    def handle_login(self):
        """Handle login attempt with enhanced logging"""
        email = self.email_var.get().strip()
        password = self.password_var.get().strip()
        
        self.logger.info(f"Login attempt for email: {email}")
        
        if not email or not password:
            self.status_label.config(text="Please enter both email and password")
            self.logger.warning("Login failed: Missing credentials")
            return
        
        # Simple authentication (replace with real authentication)
        if email == "admin@etd.com" and password == "admin123":
            self.status_label.config(text="Login successful!", foreground='green')
            self.logger.info("Login successful")
            self.parent.after(1000, lambda: self.on_login_success({
                'email': email,
                'role': 'admin'
            }))
        else:
            self.status_label.config(text="Invalid credentials", foreground='red')
            self.logger.warning(f"Login failed: Invalid credentials for {email}")

class EnhancedDataInputScreen:
    """Enhanced data input screen with comprehensive biometric integration"""
    
    def __init__(self, parent, user, on_logout, on_back):
        self.parent = parent
        self.user = user
        self.on_logout = on_logout
        self.on_back = on_back
        self.frame = ttk.Frame(parent)
        self.logger = logging.getLogger(__name__)
        
        # Initialize enhanced biometric device
        self.biometric_device = EnhancedBiometricDevice()
        
        self.setup_ui()
    
    def setup_ui(self):
        """Setup the enhanced data input UI"""
        # Header with user info and logout button
        header_frame = ttk.Frame(self.frame)
        header_frame.pack(fill='x', padx=20, pady=10)
        
        ttk.Label(header_frame, text=f"Welcome, {self.user['email']}", font=('Arial', 12, 'bold')).pack(side='left')
        ttk.Button(header_frame, text="Logout", command=self.on_logout).pack(side='right')
        
        # Main content area with scrollbar
        canvas = tk.Canvas(self.frame)
        scrollbar = ttk.Scrollbar(self.frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Form fields
        self.setup_form_fields(scrollable_frame)
        
        # Bind mousewheel to canvas
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
    
    def setup_form_fields(self, parent):
        """Setup form fields for citizen data"""
        # Title
        title_label = ttk.Label(parent, text="Citizen Information (Enhanced)", font=('Arial', 18, 'bold'))
        title_label.pack(pady=(0, 20))
        
        # Form variables
        self.form_vars = {}
        
        # Required fields
        required_fields = [
            ("Citizen ID (13 digits)", "citizen_id", True),
            ("First Name", "first_name", True),
            ("Last Name", "last_name", True),
            ("Father's Name", "father_name", True),
            ("Mother's Name", "mother_name", True),
            ("Gender", "gender", True),
            ("Date of Birth (YYYY-MM-DD)", "date_of_birth", True),
            ("Birth Country", "birth_country", True),
            ("Birth City", "birth_city", True),
            ("City", "city", True),
            ("Profession", "profession", True),
            ("Address", "address", True),
            ("Departure Date (YYYY-MM-DD)", "departure_date", True),
            ("Requested By", "requested_by", True)
        ]
        
        # Optional fields
        optional_fields = [
            ("Height", "height"),
            ("Eye Color", "eye_color"),
            ("Hair Color", "hair_color"),
            ("Transport Mode", "transport_mode"),
            ("Investor", "investor"),
            ("Reason for Deport", "reason_for_deport"),
            ("Amount", "amount"),
            ("Currency", "currency")
        ]
        
        # Create form fields
        for label, field_name, required in required_fields:
            self.create_form_field(parent, label, field_name, required)
        
        # Separator
        ttk.Separator(parent, orient='horizontal').pack(fill='x', pady=20)
        ttk.Label(parent, text="Optional Fields", font=('Arial', 12, 'bold')).pack(pady=(0, 10))
        
        for label, field_name in optional_fields:
            self.create_form_field(parent, label, field_name, False)
        
        # Enhanced biometric capture section
        self.setup_enhanced_biometric_section(parent)
        
        # Submit button
        submit_btn = ttk.Button(
            parent, 
            text="Submit Application", 
            command=self.handle_submit,
            style='Accent.TButton'
        )
        submit_btn.pack(pady=20)
        
        # Status label
        self.status_label = ttk.Label(parent, text="", foreground='green')
        self.status_label.pack()
    
    def create_form_field(self, parent, label, field_name, required):
        """Create a form field"""
        field_frame = ttk.Frame(parent)
        field_frame.pack(fill='x', pady=5)
        
        # Label
        label_text = f"{label}{' *' if required else ''}"
        ttk.Label(field_frame, text=label_text).pack(anchor='w')
        
        # Input field
        if field_name == "gender":
            # Gender dropdown
            self.form_vars[field_name] = tk.StringVar()
            gender_combo = ttk.Combobox(field_frame, textvariable=self.form_vars[field_name], width=30)
            gender_combo['values'] = ('Male', 'Female', 'Other')
            gender_combo.pack(anchor='w')
        elif field_name in ["address"]:
            # Text area for address
            self.form_vars[field_name] = tk.StringVar()
            text_area = tk.Text(field_frame, height=3, width=50)
            text_area.pack(anchor='w')
            # Store text widget reference for later retrieval
            self.form_vars[f"{field_name}_widget"] = text_area
        else:
            # Regular text input
            self.form_vars[field_name] = tk.StringVar()
            entry = ttk.Entry(field_frame, textvariable=self.form_vars[field_name], width=50)
            entry.pack(anchor='w')
    
    def setup_enhanced_biometric_section(self, parent):
        """Setup enhanced biometric capture section"""
        # Biometric section
        biometric_frame = ttk.LabelFrame(parent, text="Enhanced Biometric Capture", padding=10)
        biometric_frame.pack(fill='x', pady=20)
        
        # Device status
        self.device_status_label = ttk.Label(biometric_frame, text="Initializing enhanced biometric device...")
        self.device_status_label.pack(pady=(0, 10))
        
        # Test connection button
        test_btn = ttk.Button(
            biometric_frame, 
            text="Test Enhanced Device Connection", 
            command=self.test_enhanced_biometric_device
        )
        test_btn.pack(pady=(0, 10))
        
        # Capture fingerprint button
        self.capture_btn = ttk.Button(
            biometric_frame, 
            text="Capture Fingerprint (Enhanced)", 
            command=self.capture_fingerprint_enhanced,
            state='disabled'
        )
        self.capture_btn.pack(pady=(0, 10))
        
        # Biometric data display
        self.biometric_data_label = ttk.Label(biometric_frame, text="", wraplength=400)
        self.biometric_data_label.pack()
        
        # Test enhanced device connection on startup
        self.test_enhanced_biometric_device()
    
    def test_enhanced_biometric_device(self):
        """Test enhanced biometric device connection"""
        self.logger.info("Testing enhanced biometric device connection...")
        
        def test_in_thread():
            result = self.biometric_device.test_connection_with_retry()
            self.parent.after(0, lambda: self.handle_enhanced_device_test_result(result))
        
        threading.Thread(target=test_in_thread, daemon=True).start()
    
    def handle_enhanced_device_test_result(self, result):
        """Handle enhanced device test result"""
        if result['success'] and result['data'].get('ErrorCode') == 0:
            device_info = result['data']
            self.device_status_label.config(
                text=f"✅ Enhanced Device Connected: {device_info.get('Model', 'Unknown')} (Serial: {device_info.get('SerialNumber', 'Unknown')})",
                foreground='green'
            )
            self.capture_btn.config(state='normal')
            self.logger.info("Enhanced biometric device connection successful")
        else:
            error_msg = result.get('error', 'Unknown error')
            self.device_status_label.config(
                text=f"❌ Enhanced Device Error: {error_msg}",
                foreground='red'
            )
            self.capture_btn.config(state='disabled')
            self.logger.error(f"Enhanced biometric device connection failed: {error_msg}")
    
    def capture_fingerprint_enhanced(self):
        """Capture fingerprint using enhanced method"""
        self.capture_btn.config(state='disabled', text="Capturing with Enhanced Method...")
        self.biometric_data_label.config(text="Please place your finger on the device...")
        self.logger.info("Starting enhanced fingerprint capture...")
        
        def capture_in_thread():
            result = self.biometric_device.capture_fingerprint_with_retry()
            self.parent.after(0, lambda: self.handle_enhanced_capture_result(result))
        
        threading.Thread(target=capture_in_thread, daemon=True).start()
    
    def handle_enhanced_capture_result(self, result):
        """Handle enhanced fingerprint capture result"""
        self.capture_btn.config(state='normal', text="Capture Fingerprint (Enhanced)")
        
        if result['success'] and result['data'].get('ErrorCode') == 0:
            data = result['data']
            template = data.get('Template', '')
            quality = data.get('ImageQuality', 0)
            nfiq = data.get('NFIQ', 0)
            
            self.biometric_data_label.config(
                text=f"✅ Enhanced Fingerprint captured successfully!\nQuality: {quality}, NFIQ: {nfiq}\nTemplate length: {len(template)} characters",
                foreground='green'
            )
            
            # Store template data
            self.form_vars['fingerprint_template'] = template
            self.form_vars['fingerprint_quality'] = quality
            self.form_vars['fingerprint_nfiq'] = nfiq
            
            self.logger.info(f"Enhanced fingerprint capture successful - Quality: {quality}, NFIQ: {nfiq}")
        else:
            error_msg = result.get('error', 'Unknown error')
            self.biometric_data_label.config(
                text=f"❌ Enhanced Capture failed: {error_msg}",
                foreground='red'
            )
            self.logger.error(f"Enhanced fingerprint capture failed: {error_msg}")
    
    def handle_submit(self):
        """Handle form submission with enhanced logging"""
        self.logger.info("Processing form submission...")
        
        # Validate required fields
        required_fields = [
            'citizen_id', 'first_name', 'last_name', 'father_name', 'mother_name',
            'gender', 'date_of_birth', 'birth_country', 'birth_city', 'city',
            'profession', 'address', 'departure_date', 'requested_by'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field == 'address':
                # Get text from text widget
                widget = self.form_vars.get(f"{field}_widget")
                value = widget.get("1.0", tk.END).strip() if widget else ""
            else:
                value = self.form_vars.get(field, tk.StringVar()).get().strip()
            
            if not value:
                missing_fields.append(field.replace('_', ' ').title())
        
        if missing_fields:
            messagebox.showerror("Validation Error", f"Please fill in all required fields:\n{', '.join(missing_fields)}")
            self.logger.warning(f"Form validation failed: Missing fields: {missing_fields}")
            return
        
        # Collect form data
        form_data = {}
        for field_name, var in self.form_vars.items():
            if field_name.endswith('_widget'):
                continue
            if isinstance(var, tk.StringVar):
                form_data[field_name] = var.get().strip()
            else:
                form_data[field_name] = var
        
        # Add address from text widget
        address_widget = self.form_vars.get('address_widget')
        if address_widget:
            form_data['address'] = address_widget.get("1.0", tk.END).strip()
        
        # Add timestamp
        form_data['submitted_at'] = datetime.now().isoformat()
        
        # Log the submission
        self.logger.info(f"Form submitted successfully: {json.dumps(form_data, indent=2)}")
        
        # Show success message
        self.status_label.config(text="✅ Application submitted successfully!", foreground='green')
        messagebox.showinfo("Success", "Application submitted successfully!")

class EnhancedETDApplication:
    """Enhanced ETD application class"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("ETD Enhanced Desktop Application")
        self.root.geometry("800x600")
        self.root.minsize(600, 400)
        
        # Configure styles
        self.setup_styles()
        
        # Current screen
        self.current_screen = None
        self.user = None
        
        # Show login screen
        self.show_login_screen()
    
    def setup_styles(self):
        """Setup application styles"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configure accent button style
        style.configure('Accent.TButton', foreground='white', background='#0078d4')
        style.map('Accent.TButton', background=[('active', '#106ebe')])
    
    def show_login_screen(self):
        """Show login screen"""
        self.clear_screen()
        self.current_screen = EnhancedLoginScreen(self.root, self.on_login_success)
        self.current_screen.frame.pack(expand=True, fill='both')
    
    def show_data_input_screen(self):
        """Show data input screen"""
        self.clear_screen()
        self.current_screen = EnhancedDataInputScreen(
            self.root, 
            self.user, 
            self.on_logout,
            self.on_back
        )
        self.current_screen.frame.pack(expand=True, fill='both')
    
    def clear_screen(self):
        """Clear current screen"""
        if self.current_screen:
            self.current_screen.frame.destroy()
            self.current_screen = None
    
    def on_login_success(self, user):
        """Handle successful login"""
        self.user = user
        self.show_data_input_screen()
    
    def on_logout(self):
        """Handle logout"""
        self.user = None
        self.show_login_screen()
    
    def on_back(self):
        """Handle back navigation"""
        self.show_login_screen()
    
    def run(self):
        """Run the enhanced application"""
        try:
            logger.info("Starting Enhanced ETD Application")
            self.root.mainloop()
        except KeyboardInterrupt:
            logger.info("Application interrupted by user")
        except Exception as e:
            logger.error(f"Application error: {e}")
            messagebox.showerror("Error", f"An error occurred: {e}")

def main():
    """Main entry point for enhanced application"""
    try:
        logger.info("Initializing Enhanced ETD Application")
        app = EnhancedETDApplication()
        app.run()
    except Exception as e:
        logger.error(f"Failed to start enhanced application: {e}")
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
