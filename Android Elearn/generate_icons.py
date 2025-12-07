from PIL import Image
import os

# Path ke logo
logo_path = r"android\app\src\LogoAnroid\E-LearnLogo.png"
base_dir = r"android\app\src\main\res"

# Ukuran icon untuk berbagai density
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

# Buka gambar asli
try:
    img = Image.open(logo_path)
    print(f"Logo ditemukan: {logo_path}")
    print(f"Ukuran asli: {img.size}")
    
    # Generate icon untuk setiap ukuran
    for folder, size in sizes.items():
        # Buat folder jika belum ada
        output_dir = os.path.join(base_dir, folder)
        os.makedirs(output_dir, exist_ok=True)
        
        # Resize gambar
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Simpan sebagai ic_launcher.png
        output_path = os.path.join(output_dir, 'ic_launcher.png')
        resized_img.save(output_path, 'PNG')
        print(f"✓ Created: {output_path} ({size}x{size})")
    
    # Generate round icon juga
    for folder, size in sizes.items():
        output_dir = os.path.join(base_dir, folder)
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(output_dir, 'ic_launcher_round.png')
        resized_img.save(output_path, 'PNG')
        print(f"✓ Created: {output_path} ({size}x{size})")
    
    print("\n✅ Semua icon berhasil dibuat!")
    print("\nIcon telah disimpan di:")
    for folder in sizes.keys():
        print(f"  - {os.path.join(base_dir, folder)}")
    
except FileNotFoundError:
    print(f"❌ Error: File tidak ditemukan - {logo_path}")
except Exception as e:
    print(f"❌ Error: {str(e)}")
