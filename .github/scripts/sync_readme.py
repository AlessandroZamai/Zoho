import os
import json
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

def get_credentials():
    """Gets credentials using refresh token."""
    refresh_token = os.environ.get('GOOGLE_REFRESH_TOKEN')
    if not refresh_token:
        logger.error("GOOGLE_REFRESH_TOKEN environment variable not set")
        raise ValueError("GOOGLE_REFRESH_TOKEN environment variable not set")
        
    # Load client secrets from credentials file
    try:
        with open('credentials.json', 'r') as f:
            file_content = f.read()
            logger.debug(f"Credentials file content: {file_content}")
            client_config = json.loads(file_content)
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error reading credentials file: {str(e)}")
        raise
        
    try:
        logger.debug(f"Client config: {client_config}")
        credentials = Credentials(
            None,  # No token initially
            refresh_token=refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=client_config['web']['client_id'],
            client_secret=client_config['web']['client_secret'],
            scopes=SCOPES
        )
        
        # Force token refresh
        logger.info("Refreshing token")
        request = Request()
        credentials.refresh(request)
        logger.info("Token refreshed successfully")
        return credentials
    except KeyError as e:
        logger.error(f"KeyError: {str(e)}. Client config: {client_config}")
        raise
    except AttributeError as e:
        logger.error(f"AttributeError: {str(e)}. This might indicate that the Credentials object is None.")
        raise
    except Exception as e:
        logger.error(f"Error creating or refreshing credentials: {str(e)}")
        raise

def get_document_content(service, document_id):
    """Retrieves the content of a Google Doc."""
    try:
        document = service.documents().get(documentId=document_id).execute()
        return document
    except HttpError as err:
        print(f'An error occurred: {err}')
        return None

def is_list_item(paragraph):
    """Check if paragraph is a list item."""
    return 'bullet' in paragraph or 'numbering' in paragraph.get('paragraphStyle', {})

def get_list_marker(paragraph, list_id_to_level):
    """Get the appropriate list marker."""
    if 'bullet' in paragraph:
        return '- '
    elif 'paragraphStyle' in paragraph and 'numbering' in paragraph['paragraphStyle']:
        list_id = paragraph['paragraphStyle']['numbering'].get('listId', '')
        level = list_id_to_level.get(list_id, 1)
        list_id_to_level[list_id] = level + 1
        return f"{level}. "
    return ''

def convert_to_markdown(document):
    """Converts Google Doc content to Markdown format."""
    content = []
    list_id_to_level = {}
    in_code_block = False
    in_table = False
    table_data = []
    
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
                        content.append(f"{'#' * level} {text.strip()}\n\n")
                        continue
            
            # Handle lists
            if is_list_item(paragraph):
                marker = get_list_marker(paragraph, list_id_to_level)
                text = get_text_from_paragraph(paragraph)
                indent = '  ' * (paragraph.get('indentLevel', 0))
                content.append(f"{indent}{marker}{text}\n")
                continue
            
            # Handle code blocks
            if 'COURIER_NEW' in str(paragraph):
                if not in_code_block:
                    content.append('```\n')
                    in_code_block = True
                text = get_text_from_paragraph(paragraph, preserve_whitespace=True)
                content.append(f"{text}\n")
                continue
            elif in_code_block:
                content.append('```\n\n')
                in_code_block = False
            
            # Regular paragraph
            text = get_text_from_paragraph(paragraph)
            if text:
                content.append(f"{text}\n\n")
        
        # Handle tables
        elif 'table' in element:
            table = element.get('table')
            table_data = []
            for row in table.get('tableRows', []):
                row_data = []
                for cell in row.get('tableCells', []):
                    cell_content = []
                    for content_item in cell.get('content', []):
                        if 'paragraph' in content_item:
                            text = get_text_from_paragraph(content_item['paragraph'])
                            cell_content.append(text)
                    row_data.append(' '.join(cell_content))
                table_data.append(row_data)
            
            # Convert table data to markdown
            if table_data:
                # Header row
                content.append('| ' + ' | '.join(table_data[0]) + ' |\n')
                # Separator
                content.append('| ' + ' | '.join(['---'] * len(table_data[0])) + ' |\n')
                # Data rows
                for row in table_data[1:]:
                    content.append('| ' + ' | '.join(row) + ' |\n')
                content.append('\n')
                
    return ''.join(content)

def get_text_from_paragraph(paragraph, preserve_whitespace=False):
    """Extracts text content from a paragraph element."""
    text_elements = []
    
    for element in paragraph.get('elements', []):
        if 'textRun' in element:
            text_run = element.get('textRun')
            if 'content' in text_run:
                text = text_run.get('content')
                if not preserve_whitespace:
                    text = text.strip()
                
                # Apply text styling
                text_style = text_run.get('textStyle', {})
                
                # Only apply styling if there's actual content
                if text.strip():
                    if text_style.get('bold'):
                        text = f"**{text}**"
                    if text_style.get('italic'):
                        text = f"_{text}_"
                    if text_style.get('strikethrough'):
                        text = f"~~{text}~~"
                    if text_style.get('underline'):
                        text = f"__{text}__"
                    
                    # Handle links
                    if text_style.get('link'):
                        url = text_style['link'].get('url', '')
                        text = f"[{text}]({url})"
                
                text_elements.append(text)
    
    result = ''.join(text_elements)
    return result if preserve_whitespace else result.strip()

def main():
    """Main function to sync Google Doc to README."""
    try:
        # Get document ID from environment
        document_id = os.environ.get('DOCUMENT_ID')
        if not document_id:
            raise ValueError("DOCUMENT_ID environment variable not set")

        logger.info("Initializing credentials")
        try:
            credentials = get_credentials()
            if not credentials:
                raise ValueError("Failed to obtain credentials")
        except Exception as e:
            logger.error(f"Error getting credentials: {str(e)}")
            raise

        logger.info("Building service")
        try:
            service = build('docs', 'v1', credentials=credentials)
            if not service:
                raise ValueError("Failed to build service")
        except Exception as e:
            logger.error(f"Error building service: {str(e)}")
            raise

        logger.info("Fetching document content")
        try:
            document = get_document_content(service, document_id)
            if not document:
                raise ValueError("Failed to fetch document content")
        except Exception as e:
            logger.error(f"Error fetching document: {str(e)}")
            raise

        logger.info("Converting to Markdown")
        try:
            markdown_content = convert_to_markdown(document)
            if not markdown_content:
                raise ValueError("Failed to convert document to Markdown")
        except Exception as e:
            logger.error(f"Error converting to Markdown: {str(e)}")
            raise

        logger.info("Writing to README.md")
        try:
            with open('README.md', 'w', encoding='utf-8') as f:
                f.write(markdown_content)
        except Exception as e:
            logger.error(f"Error writing to README.md: {str(e)}")
            raise

        logger.info("Successfully updated README.md")

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        logger.exception("Stack trace:")
        exit(1)

if __name__ == '__main__':
    main()
