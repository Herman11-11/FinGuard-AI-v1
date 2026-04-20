import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import RadialGradiantColorMask
import io
import base64
from datetime import datetime
import json
import hashlib
from PIL import Image, ImageDraw, ImageFont
import os

class QRService:
    @staticmethod
    def _verification_portal_base() -> str:
        return os.getenv("FINGUARD_VERIFY_URL", "https://verify.lands.go.tz/verify")

    @classmethod
    def build_qr_payload(cls, record_id: str) -> str:
        portal_base = cls._verification_portal_base()
        return "\n".join([
            "MINISTRY OF LANDS - TANZANIA",
            "Official Title Deed Verification",
            f"Record ID: {record_id}",
            "",
            "How to verify:",
            "1. Open the verification portal",
            f"2. Go to: {portal_base}",
            f"3. Enter Record ID: {record_id}",
        ])

    @staticmethod
    def generate_document_qr(document_data: dict, fingerprint: str) -> str:
        """
        Generate a styled QR code for a land document
        
        Returns: base64 encoded image
        """
        # Create QR data payload
        record_id = document_data.get('record_id') or "UNKNOWN"
        qr_text = "\n".join([
            "MINISTRY OF LANDS - TANZANIA",
            "Official Land Record",
            f"Record ID: {record_id}",
            f"Owner: {document_data.get('owner', 'N/A')}",
            f"Plot: {document_data.get('plot_number', 'N/A')}",
            "",
            "Verification:",
            f"Portal: {QRService._verification_portal_base()}",
            f"Fingerprint Ref: {fingerprint[:16]}...",
        ])
        
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        
        # Add data
        qr.add_data(qr_text)
        qr.make(fit=True)
        
        # Create styled image
        img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
            color_mask=RadialGradiantColorMask(
                center_color=(0, 100, 0),  # Dark green
                edge_color=(0, 150, 0)      # Light green
            ),
            fill_color=(0, 100, 0),
            back_color=(255, 255, 255)
        )
        
        # Add Ministry logo/title at bottom
        img = img.convert('RGB')
        draw = ImageDraw.Draw(img)
        
        # Add text at bottom
        try:
            # Try to load a font, fallback to default
            font = ImageFont.load_default()
            text = "Ministry of Lands - Tanzania"
            # Get text size
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            # Center text
            draw.text(
                ((img.width - text_width) // 2, img.height - 30),
                text,
                fill=(0, 100, 0),
                font=font
            )
        except:
            pass  # Skip if font fails
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return img_str
    
    @staticmethod
    def generate_verification_url(record_id: str) -> str:
        """Generate a verification URL for QR code"""
        return f"{QRService._verification_portal_base()}?doc={record_id}"
    
    @staticmethod
    def generate_mini_qr(record_id: str) -> str:
        """Generate a small QR code for printing on documents"""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=4,
            border=2,
        )
        
        qr.add_data(QRService.build_qr_payload(record_id))
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return img_str
    
    @staticmethod
    def decode_qr(qr_image_base64: str) -> dict:
        """Decode a QR code image"""
        try:
            # Decode base64 to image
            image_data = base64.b64decode(qr_image_base64)
            img = Image.open(io.BytesIO(image_data))
            
            # Use pyzbar to decode (would need installation)
            raise NotImplementedError("QR decoding not configured")
        except Exception as e:
            return {"error": str(e)}
