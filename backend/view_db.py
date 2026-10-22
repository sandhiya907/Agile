import sqlite3
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

DB_PATH = os.path.join(os.path.dirname(__file__), "instance", "spendwise.db")

def view_database():
    if not os.path.exists(DB_PATH):
        print(f"Database file not found at: {DB_PATH}")
        return

    print("=" * 65)
    print(" SPENDWISE DATABASE VIEWER")
    print(f" File Location: {DB_PATH}")
    print("=" * 65)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [r[0] for r in cur.fetchall()]

    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]

        print(f"\n[TABLE] {table}  ({count} total records)")
        print("-" * 65)

        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()

        if not rows:
            print("  (Table is empty)")
            continue

        for idx, row in enumerate(rows, start=1):
            row_dict = dict(row)
            # Mask sensitive password hash for clean display
            if "password_hash" in row_dict and row_dict["password_hash"]:
                row_dict["password_hash"] = row_dict["password_hash"][:18] + "... [PROTECTED]"
            
            print(f"  Row {idx}: {row_dict}")

    conn.close()
    print("\n" + "=" * 65)

if __name__ == "__main__":
    view_database()
