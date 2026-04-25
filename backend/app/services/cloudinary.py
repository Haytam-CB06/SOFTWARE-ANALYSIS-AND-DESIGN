import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import os
from dotenv import load_dotenv
load_dotenv()


def configure_cloudinary() -> None:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


configure_cloudinary()


def build_optimized_url(public_id: str) -> str:
    url, _ = cloudinary_url(
        public_id,
        fetch_format="auto",
        quality="auto",
        secure=True,
    )
    return url


def build_auto_crop_url(public_id: str, *, width: int = 500, height: int = 500) -> str:
    url, _ = cloudinary_url(
        public_id,
        width=width,
        height=height,
        crop="auto",
        gravity="auto",
        secure=True,
    )
    return url

