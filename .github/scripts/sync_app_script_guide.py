import os
import json
import logging
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Update scopes to include both documents and drive readonly
SCOPES = ['https://www.googleapis.com/auth/documents.readonly', 'https://www.googleapis.com/auth/drive.readonly']

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

def download_as_markdown(service, document_id):
    """Downloads the Google Doc as markdown using the Drive API."""
    try:
        # First, get the file metadata to check permissions
        file_metadata = service.files().get(fileId=document_id, fields="capabilities").execute()
        if not file_metadata['capabilities']['canDownload']:
            raise ValueError(f"The service account does not have permission to download the document with ID: {document_id}")

        # If we have permission, proceed with the download
        request = service.files().export_media(fileId=document_id, mimeType='text/markdown')
        content = request.execute()
        return content.decode('utf-8')
    except HttpError as error:
        logger.error(f'An error occurred: {error}')
        raise

def main():
    """Main function to sync Google Doc to APP_SCRIPT_GUIDE."""
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
            service = build('drive', 'v3', credentials=credentials)
            if not service:
                raise ValueError("Failed to build service")
        except Exception as e:
            logger.error(f"Error building service: {str(e)}")
            raise

        logger.info("Downloading markdown content")
        try:
            markdown_content = download_as_markdown(service, document_id)
            if not markdown_content:
                raise ValueError("Failed to download markdown content")
        except Exception as e:
            logger.error(f"Error downloading markdown: {str(e)}")
            raise

        logger.info("Writing to APP_SCRIPT_GUIDE.md")
        try:
            with open('APP_SCRIPT_GUIDE.md', 'w', encoding='utf-8') as f:
                f.write(markdown_content)
        except Exception as e:
            logger.error(f"Error writing to APP_SCRIPT_GUIDE.md: {str(e)}")
            raise

        logger.info("Successfully updated APP_SCRIPT_GUIDE.md")

    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        logger.exception("Stack trace:")
        exit(1)

if __name__ == '__main__':
    main()
