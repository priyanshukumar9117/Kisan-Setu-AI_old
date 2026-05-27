import os
import csv
import re

DATA_DIR = "data"

def chunk_text(text, max_len=500):
    sentences = re.split(r'(?<=[।.!?\n])\s*', text)
    chunks, current = [], ""
    for s in sentences:
        s = s.strip()
        if not s: continue
        if len(current) + len(s) + 1 > max_len and current:
            chunks.append(current.strip())
            current = s
        else:
            current = (current + " " + s).strip()
    if current.strip():
        chunks.append(current.strip())
    return chunks

def convert_to_csv(txt_path, csv_path):
    print(f"Converting {txt_path} to {csv_path}...")
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        topic = os.path.splitext(os.path.basename(txt_path))[0].replace('_', ' ').title()
        chunks = chunk_text(content)
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['topic', 'content'])
            for chunk in chunks:
                if len(chunk) > 10:
                    writer.writerow([topic, chunk])
        return True
    except Exception as e:
        print(f"Error converting {txt_path}: {e}")
        return False

def cleanup():
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            if file.endswith(('.txt', '.md')):
                source_path = os.path.join(root, file)
                csv_path = os.path.join(root, os.path.splitext(file)[0] + '.csv')
                
                # If csv doesn't exist, create it
                if not os.path.exists(csv_path):
                    success = convert_to_csv(source_path, csv_path)
                    if success:
                        print(f"Created {csv_path}")
                
                # Now remove the source markdown/text file
                print(f"Removing {source_path}")
                os.remove(source_path)

if __name__ == "__main__":
    cleanup()
    print("Done cleaning up data folder.")
