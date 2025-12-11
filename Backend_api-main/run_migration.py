"""
Run database migrations for user_devices table
"""
import pymysql
import sys

# Database configuration (sesuai dengan app/core/database.py)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'e-learn',
    'charset': 'utf8mb4'
}

def run_migration():
    """Create user_devices table if not exists"""
    try:
        # Connect to database
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        print("🔗 Connected to database:", DB_CONFIG['database'])
        
        # Read SQL migration file
        with open('migrations/create_user_devices_table.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
        
        for statement in statements:
            if statement:
                print(f"📝 Executing: {statement[:50]}...")
                cursor.execute(statement)
                connection.commit()
                print("✅ Success")
        
        # Verify table exists
        cursor.execute("SHOW TABLES LIKE 'user_devices'")
        result = cursor.fetchone()
        
        if result:
            print("\n✅ Table 'user_devices' created successfully!")
            
            # Show table structure
            cursor.execute("DESCRIBE user_devices")
            columns = cursor.fetchall()
            print("\n📋 Table structure:")
            for col in columns:
                print(f"   - {col[0]}: {col[1]}")
        else:
            print("\n❌ Table 'user_devices' was not created")
            
        cursor.close()
        connection.close()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Running user_devices table migration...\n")
    success = run_migration()
    sys.exit(0 if success else 1)
