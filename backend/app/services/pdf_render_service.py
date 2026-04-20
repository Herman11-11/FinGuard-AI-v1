import io
import hashlib
import re

import pypdfium2 as pdfium


class PDFRenderService:
    @staticmethod
    def render_first_page(pdf_bytes: bytes, scale: float = 2.0) -> bytes:
        document = pdfium.PdfDocument(pdf_bytes)
        if len(document) == 0:
            raise ValueError("PDF has no pages")

        page = document[0]
        bitmap = page.render(scale=scale)
        image = bitmap.to_pil()

        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return buffer.getvalue()

    @staticmethod
    def extract_text(pdf_bytes: bytes) -> str:
        document = pdfium.PdfDocument(pdf_bytes)
        if len(document) == 0:
            raise ValueError("PDF has no pages")

        parts = []
        for index in range(len(document)):
            page = document[index]
            textpage = page.get_textpage()
            parts.append(textpage.get_text_range() or "")

        return "\n".join(parts)

    @classmethod
    def build_text_signature(cls, pdf_bytes: bytes) -> dict:
        text = cls.extract_text(pdf_bytes)
        normalized = re.sub(r"\s+", " ", text).strip().lower()
        signature = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        return {
            "algorithm": "pdf_text_sha256",
            "signature": signature,
            "text_length": len(normalized),
        }
