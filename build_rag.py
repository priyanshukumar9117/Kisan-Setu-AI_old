import os
import argparse
import shutil
import warnings
import logging

# Silence deprecation and info warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
logging.getLogger("transformers").setLevel(logging.ERROR)
os.environ["TOKENIZERS_PARALLELISM"] = "false"
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader, CSVLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_PATH = "chroma_db"
DATA_PATH = "data"

def main():
    parser = argparse.ArgumentParser(description="Build ChromaDB vector store for Kisan Sarthi.")
    parser.add_argument("--reset", action="store_true", help="Reset the database by deleting the existing one.")
    args = parser.parse_args()

    # Create data directory if it doesn't exist
    os.makedirs(DATA_PATH, exist_ok=True)
    
    if args.reset:
        if os.path.exists(CHROMA_PATH):
            shutil.rmtree(CHROMA_PATH)
            print(f"Database '{CHROMA_PATH}' has been cleared.")
        else:
            print(f"Database '{CHROMA_PATH}' does not exist.")
            
    print(f"Looking for documents in the '{DATA_PATH}' directory...")
    
    # Load PDFs (if any)
    pdf_loader = DirectoryLoader(DATA_PATH, glob="**/*.pdf", loader_cls=PyPDFLoader)
    pdf_documents = pdf_loader.load()
    
    # Load CSVs (main data format now)
    csv_loader = DirectoryLoader(DATA_PATH, glob="**/*.csv", loader_cls=CSVLoader)
    csv_documents = csv_loader.load()
    
    # Load TXT files (plain text documents)
    txt_loader = DirectoryLoader(DATA_PATH, glob="**/*.txt", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
    txt_documents = txt_loader.load()
    
    # Load Markdown files
    md_loader = DirectoryLoader(DATA_PATH, glob="**/*.md", loader_cls=TextLoader, loader_kwargs={'encoding': 'utf-8'})
    md_documents = md_loader.load()
    
    documents = pdf_documents + csv_documents + txt_documents + md_documents
    
    if not documents:
        print(f"WARNING: No documents found in '{DATA_PATH}'. Supported formats: .pdf, .csv, .txt, .md")
        return
        
    print(f"Loaded {len(documents)} documents.")
    
    # Split the loaded documents into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split documents into {len(chunks)} text chunks.")
    
    # Embed chunks using a multilingual model
    print("Initializing multilingual sentence embedding model (paraphrase-multilingual-MiniLM-L12-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    
    # Storing embeddings in ChromaDB
    print(f"Saving vector database to '{CHROMA_PATH}'...")
    db = Chroma.from_documents(
        chunks, 
        embeddings, 
        persist_directory=CHROMA_PATH
    )
    
    print("Success: RAG Vector database built and saved persistently!")

if __name__ == "__main__":
    main()
