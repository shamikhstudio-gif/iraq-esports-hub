import subprocess
import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

def main():
    print("=" * 65)
    print("  Babylon Network - Iraq eSports Platform")
    print("  Starting Home Network Server on 0.0.0.0:3000")
    print("  >> iPad / Local Network URL: http://192.168.1.16:3000")
    print("  >> Localhost URL:            http://localhost:3000")
    print("=" * 65)
    
    cmd = "npx next dev -H 0.0.0.0 -p 3000"
    subprocess.run(cmd, shell=True)

if __name__ == '__main__':
    main()