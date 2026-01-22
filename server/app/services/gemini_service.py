from google import genai
from google.genai import types
from app.core.config import settings
import logging
import datetime
from pathlib import Path
import json

logger = logging.getLogger(__name__)


# TODO: revert back to context caching once i get a paid api_key
#  cos vertex ai is paid and chef is lowkey broke asf :)
class GeminiService:
    def __init__(self):
        self.client = None
        if settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(
                    api_key="AIzaSyA1fYoJIDzcsokOp0h5VX-V6tlNakbaCAk"
                )
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
        else:
            logger.warning("GEMINI_API_KEY not set.")

    def create_context_cache(self, file_paths: list[Path], user_id: str) -> str:
        """
        Uploads files and creates a context cache.
        Returns the cache name (e.g., 'cachedContents/123...')
        """
        if not self.client:
            raise ValueError("Gemini client not initialized")

        uploaded_files = []
        for path in file_paths:
            logger.info(
                f"Uploading {path.name} ({path.stat().st_size} bytes) to Gemini..."
            )
            try:
                import mimetypes

                mime_type, _ = mimetypes.guess_type(str(path))
                if not mime_type:
                    ext = path.suffix.lower()
                    if ext == ".pdf":
                        mime_type = "application/pdf"
                    elif ext in (".jpg", ".jpeg"):
                        mime_type = "image/jpeg"
                    elif ext == ".png":
                        mime_type = "image/png"
                    elif ext == ".txt":
                        mime_type = "text/plain"
                    elif ext == ".dcm":
                        mime_type = "application/dicom"
                    else:
                        mime_type = "application/octet-stream"

                logger.info(f"Detected MIME type: {mime_type}")

                with open(path, "rb") as f:
                    file_obj = self.client.files.upload(
                        file=f, config=types.UploadFileConfig(mime_type=mime_type)
                    )
                logger.info(f"Upload successful. File URI: {file_obj.name}")
                uploaded_files.append(file_obj)
            except Exception as e:
                logger.error(f"Failed to upload {path}: {e}", exc_info=True)
                raise e

        logger.info(f"All {len(uploaded_files)} files uploaded. Creating cache...")


        ttl_seconds = 3600

        system_instruction = "You are MedLM, an expert medical AI assistant. Analyze the provided medical history with precision. Always cite specific documents when possible. Your goal is to find invisible trends and construct a chronological timeline."

        try:
            cache_contents = []
            for f in uploaded_files:
                cache_contents.append(
                    types.Content(
                        role="user",
                        parts=[
                            types.Part(
                                file_data=types.FileData(
                                    mime_type=f.mime_type, file_uri=f.uri
                                )
                            )
                        ],
                    )
                )

            print(cache_contents)

            cache = self.client.caches.create(
                model="gemini-3-flash-preview",
                config=types.CreateCachedContentConfig(
                    display_name=f"medlm_user_{user_id}",
                    system_instruction=system_instruction,
                    contents=cache_contents,
                    ttl=f"{ttl_seconds}s",
                ),
            )
            logger.info(
                f"Cache created successfully. Name: {cache.name}, Display Name: {getattr(cache, 'display_name', 'N/A')}"
            )
            return cache.name
        except Exception as e:
            logger.error(f"Cache creation failed: {e}", exc_info=True)
            raise e

    def generate_content(self, cache_name: str, prompt: str) -> str:
        """
        Generate content using the cached context.
        """
        if not self.client:
            return "AI Error: Client not initialized"

        try:
            response = self.client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=prompt,
                config=types.GenerateContentConfig(cached_content=cache_name),
            )
            return response.text
        except Exception as e:
            logger.error(f"Generate content failed: {e}")
            raise e

    def generate_content_stream(self, cache_name: str, prompt: str):
        """
        Stream content using the cached context.
        Yields chunks of text.
        """
        if not self.client:
            yield "AI Error: Client not initialized"
            return

        try:
            response = self.client.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(cached_content=cache_name),
            )
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Generate stream failed: {e}")
            yield f"Error: {e}"

            yield f"Error: {e}"

    def find_active_cache(self, user_id: str) -> str | None:
        """
        List active caches and find one belonging to the user.
        """
        if not self.client:
            return None

        try:
            caches = self.client.caches.list()
            target_name = f"medlm_user_{user_id}"

            for cache in caches:
                if getattr(cache, "display_name", "") == target_name:
                    expire_time = getattr(cache, "expire_time", None)

                    if expire_time:
                        now = datetime.datetime.now(datetime.timezone.utc)
                        if expire_time > now:
                            return cache.name
                        else:
                            logger.info(f"Found expired cache {cache.name}, ignoring.")
                    else:
                        pass
            return None
        except Exception as e:
            logger.error(f"Failed to list caches: {e}")
            return None


gemini_service = GeminiService()
