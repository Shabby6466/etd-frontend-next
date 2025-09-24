#!/usr/bin/env python3
"""
Enhanced ETD Application Launcher

This launcher includes all the fixes and enhancements for biometric device integration.
"""

import sys
import os
import subprocess
import ctypes

def is_admin():
    """Check if running as administrator"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def main():
    """Main launcher function"""
    print("ETD Enhanced Application Launcher")
    print("=" * 50)
    
    if not is_admin():
        print("Warning: Not running as Administrator")
        print("For best results, run as Administrator")
        print("Continuing with current privileges...")
    
    # Import and run enhanced application
    try:
        from main_enhanced import main as run_enhanced_app
        print("Starting Enhanced ETD Application...")
        run_enhanced_app()
    except ImportError:
        print("Enhanced application not found, running standard application...")
        from main import main as run_standard_app
        run_standard_app()

if __name__ == "__main__":
    main()
