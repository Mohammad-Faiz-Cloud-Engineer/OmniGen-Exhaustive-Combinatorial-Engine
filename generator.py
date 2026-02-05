import sys
import itertools
import argparse
import signal
import time
import shutil
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# -----------------------------------------------------------------------------
# Configuration & Globals
# -----------------------------------------------------------------------------
stop_requested = False

def signal_handler(sig, frame):
    """Handle SIGTERM to gracefully stop the loop."""
    global stop_requested
    stop_requested = True

signal.signal(signal.SIGTERM, signal_handler)

def check_disk_space(min_mb=500):
    """Ensure there is enough disk space (default 500MB)."""
    total, used, free = shutil.disk_usage(".")
    free_mb = free / (1024 * 1024)
    if free_mb < min_mb:
        print(f"ERROR: Low disk space! Only {free_mb:.2f}MB available.", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="OmniGen Generator")
    parser.add_argument("--charset", required=True, help="Characters to combine")
    parser.add_argument("--min", type=int, required=True, help="Minimum length")
    parser.add_argument("--max", type=int, required=True, help="Maximum length")
    args = parser.parse_args()

    charset = args.charset
    min_len = args.min
    max_len = args.max

    print(f"Starting generation for lengths {min_len}-{max_len} with charset '{charset}'")
    sys.stdout.flush()

    check_disk_space()

    # Open files safely
    f_txt = open("output.txt", "w", encoding="utf-8")
    f_md = open("output.md", "w", encoding="utf-8")
    
    # ReportLab setup
    c = canvas.Canvas("output.pdf", pagesize=letter)
    width, height = letter
    text_object = c.beginText(40, height - 40)
    text_object.setFont("Helvetica", 10)
    line_height = 12

    count = 0
    start_time = time.time()

    try:
        f_md.write("# OmniGen Output\n\n")

        for length in range(min_len, max_len + 1):
            if stop_requested:
                break
            
            # itertools.product generates tuples: ('a', 'b') -> "ab"
            for combination in itertools.product(charset, repeat=length):
                if stop_requested:
                    break
                
                s = "".join(combination)
                
                # Write to TXT
                f_txt.write(s + "\n")
                
                # Write to MD
                f_md.write(f"- {s}\n")
                
                # Write to PDF
                text_object.textLine(s)
                if text_object.getY() < 40:  # New page if at bottom
                    c.drawText(text_object)
                    c.showPage()
                    text_object = c.beginText(40, height - 40)
                    text_object.setFont("Helvetica", 10)

                count += 1

                # Update Node.js every 1000 iterations
                if count % 1000 == 0:
                    print(f"{count}")
                    sys.stdout.flush()
                    # Check disk space periodically to avoid filling disk mid-run
                    if count % 100000 == 0:
                        check_disk_space(min_mb=100)

    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
    
    finally:
        print("Finishing up...")
        sys.stdout.flush()
        
        # Close text files
        f_txt.close()
        f_md.close()
        
        # Save PDF
        if text_object:
            c.drawText(text_object)
        c.save()
        
        print("Done.")
        sys.stdout.flush()

if __name__ == "__main__":
    main()
