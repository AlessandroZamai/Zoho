import os
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

def get_credentials():
    """Gets credentials using refresh token."""
    refresh_token = os.environ.get('GOOGLE_REFRESH_TOKEN')
    if not refresh_token:
        raise ValueError("GOOGLE_REFRESH_TOKEN environment variable not set")
        
    # Load client secrets from credentials file
    with open('credentials.json', 'r') as f:
        client_config = json.load(f)
        
    credentials = Credentials(
        None,  # No token initially
        refresh_token=refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=client_config['web']['client_id'],
        client_secret=client_config['web']['client_secret'],
        scopes=SCOPES
    )
    
    # Force token refresh
    credentials.refresh(None)
    return credentials

def get_document_content(service, document_id):
    """Retrieves the content of a Google Doc."""
    try:
        document = service.documents().get(documentId=document_id).execute()
        return document
    except HttpError as err:
        print(f'An error occurred: {err}')
        return None

def convert_to_markdown(document):
    """Converts Google Doc content to Markdown format."""
    content = []
    
    for element in document.get('body').get('content'):
        if 'paragraph' in element:
            paragraph = element.get('paragraph')
            
            # Check if it's a header
            if 'paragraphStyle' in paragraph:
                style = paragraph.get('paragraphStyle')
                if 'namedStyleType' in style:
                    named_style = style.get('namedStyleType')
                    if 'HEADING' in named_style:
                        level = int(named_style[-1])  # Get heading level
                        text = get_text_from_paragraph(paragraph)
                        content.append(f"{'#' * level} {text}\n")
                        continue
            
            # Regular paragraph
            text = get_text_from_paragraph(paragraph)
            if text:
                content.append(f"{text}\n\n")
                
    return ''.join(content)

def get_text_from_paragraph(paragraph):
    """Extracts text content from a paragraph element."""
    text_elements = []
    
    for element in paragraph.get('elements', []):
        if 'textRun' in element:
            text_run = element.get('textRun')
            if 'content' in text_run:
                text = text_run.get('content')
                
                # Apply text styling
                text_style = text_run.get('textStyle', {})
                
                if text_style.get('bold'):
                    text = f"**{text}**"
                if text_style.get('italic'):
                    text = f"_{text}_"
                if text_style.get('strikethrough'):
                    text = f"~~{text}~~"
                if text_style.get('underline'):
                    text = f"__{text}__"
                
                text_elements.append(text)
    
    return ''.join(text_elements).strip()

def main():
    """Main function to sync Google Doc to README."""
    try:
        # Get document ID from environment
        document_id = os.environ.get('DOCUMENT_ID')
        if not document_id:
            raise ValueError("DOCUMENT_ID environment variable not set")

        # Initialize the Docs API client
        credentials = get_credentials()
        service = build('docs', 'v1', credentials=credentials)

        # Get the document content
        document = get_document_content(service, document_id)
        if not document:
            raise Exception("Failed to fetch document content")

        # Convert to Markdown
        markdown_content = convert_to_markdown(document)

        # Write to README.md
        with open('README.md', 'w', encoding='utf-8') as f:
            f.write(markdown_content)

        print("Successfully updated README.md")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        exit(1)

if __name__ == '__main__':
    main()
