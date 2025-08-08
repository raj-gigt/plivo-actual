import os
import re
import requests
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, Optional
import logging
from PyPDF2 import PdfReader
from docx import Document
from bs4 import BeautifulSoup
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle
import base64
import io

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        self.google_drive_service = None
        self.setup_google_drive()
    
    def setup_google_drive(self):
        """Setup Google Drive API service"""
        try:
            # Google Drive API scopes
            SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
            
            creds = None
            # The file token.pickle stores the user's access and refresh tokens
            if os.path.exists('token.pickle'):
                with open('token.pickle', 'rb') as token:
                    creds = pickle.load(token)
            
            # If there are no (valid) credentials available, let the user log in
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    # For now, we'll skip Google Drive setup if credentials aren't available
                    logger.warning("Google Drive credentials not available. Google Drive links will not work.")
                    return
                
                # Save the credentials for the next run
                with open('token.pickle', 'wb') as token:
                    pickle.dump(creds, token)
            
            self.google_drive_service = build('drive', 'v3', credentials=creds)
            logger.info("Google Drive API service initialized successfully")
            
        except Exception as e:
            logger.warning(f"Failed to setup Google Drive API: {str(e)}")
            self.google_drive_service = None
    
    def extract_google_drive_id(self, url: str) -> Optional[str]:
        """Extract Google Drive file ID from various Google Drive URL formats"""
        try:
            # Handle different Google Drive URL formats
            if 'drive.google.com' in url:
                # Format: https://drive.google.com/file/d/{file_id}/view
                match = re.search(r'/file/d/([a-zA-Z0-9_-]+)', url)
                if match:
                    return match.group(1)
                
                # Format: https://drive.google.com/open?id={file_id}
                match = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', url)
                if match:
                    return match.group(1)
                
                # Format: https://docs.google.com/document/d/{file_id}/edit
                match = re.search(r'/document/d/([a-zA-Z0-9_-]+)', url)
                if match:
                    return match.group(1)
                
                # Format: https://docs.google.com/spreadsheets/d/{file_id}/edit
                match = re.search(r'/spreadsheets/d/([a-zA-Z0-9_-]+)', url)
                if match:
                    return match.group(1)
            
            return None
        except Exception as e:
            logger.error(f"Error extracting Google Drive ID: {str(e)}")
            return None
    
    def get_google_drive_content(self, file_id: str) -> Optional[str]:
        """Get content from Google Drive file"""
        try:
            if not self.google_drive_service:
                return None
            
            # Get file metadata
            file_metadata = self.google_drive_service.files().get(
                fileId=file_id, 
                fields='name,mimeType'
            ).execute()
            
            mime_type = file_metadata.get('mimeType', '')
            
            # Handle different file types
            if 'google-apps.document' in mime_type:
                # Google Docs
                content = self.google_drive_service.files().export(
                    fileId=file_id, 
                    mimeType='text/plain'
                ).execute()
                return content.decode('utf-8')
            
            elif 'google-apps.spreadsheet' in mime_type:
                # Google Sheets
                content = self.google_drive_service.files().export(
                    fileId=file_id, 
                    mimeType='text/csv'
                ).execute()
                return content.decode('utf-8')
            
            elif 'application/pdf' in mime_type:
                # PDF files
                response = self.google_drive_service.files().get_media(fileId=file_id).execute()
                return self.extract_pdf_text(io.BytesIO(response))
            
            elif 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in mime_type:
                # DOCX files
                response = self.google_drive_service.files().get_media(fileId=file_id).execute()
                return self.extract_docx_text(io.BytesIO(response))
            
            else:
                # Try to get as plain text
                try:
                    content = self.google_drive_service.files().export(
                        fileId=file_id, 
                        mimeType='text/plain'
                    ).execute()
                    return content.decode('utf-8')
                except:
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting Google Drive content: {str(e)}")
            return None
    
    def extract_pdf_text(self, file_stream) -> str:
        """Extract text from PDF file"""
        try:
            pdf_reader = PdfReader(file_stream)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            return ""
    
    def extract_docx_text(self, file_stream) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_stream)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {str(e)}")
            return ""
    
    def extract_url_content(self, url: str) -> str:
        """Extract content from URL"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html5lib')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Get text content
            text = soup.get_text()
            
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            return text
        except Exception as e:
            logger.error(f"Error extracting URL content: {str(e)}")
            return ""
    
    def process_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process document based on input type"""
        try:
            content = ""
            source_type = ""
            
            if 'file' in document_data:
                # Handle uploaded file
                file = document_data['file']
                file_content = file.read()
                file_extension = os.path.splitext(file.filename)[1].lower()
                
                if file_extension == '.pdf':
                    content = self.extract_pdf_text(io.BytesIO(file_content))
                    source_type = "PDF"
                elif file_extension in ['.docx', '.doc']:
                    content = self.extract_docx_text(io.BytesIO(file_content))
                    source_type = "DOCX"
                else:
                    return {
                        'success': False,
                        'error': f'Unsupported file type: {file_extension}'
                    }
            
            elif 'url' in document_data:
                # Handle URL
                url = document_data['url'].strip()
                
                # Check if it's a Google Drive URL
                drive_id = self.extract_google_drive_id(url)
                if drive_id:
                    content = self.get_google_drive_content(drive_id)
                    source_type = "Google Drive"
                    if not content:
                        return {
                            'success': False,
                            'error': 'Could not access Google Drive file. Please ensure the file is publicly accessible.'
                        }
                else:
                    # Regular URL
                    content = self.extract_url_content(url)
                    source_type = "URL"
                    if not content:
                        return {
                            'success': False,
                            'error': 'Could not extract content from URL. Please check if the URL is accessible.'
                        }
            
            elif 'text' in document_data:
                # Handle direct text input
                content = document_data['text']
                source_type = "Text"
            
            else:
                return {
                    'success': False,
                    'error': 'No document data provided. Please provide a file, URL, or text.'
                }
            
            if not content or len(content.strip()) == 0:
                return {
                    'success': False,
                    'error': 'No content could be extracted from the document.'
                }
            
            # Truncate content if too long (Gemini has limits)
            if len(content) > 30000:
                content = content[:30000] + "\n\n[Content truncated due to length...]"
            
            return {
                'success': True,
                'content': content,
                'source_type': source_type,
                'content_length': len(content)
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            return {
                'success': False,
                'error': f'Error processing document: {str(e)}'
            } 