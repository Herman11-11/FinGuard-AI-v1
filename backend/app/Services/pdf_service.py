from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.lib.fonts import addMapping
import io
import base64
import qrcode
from datetime import datetime
import os

class PDFService:
    @staticmethod
    def generate_title_deed(document_data: dict, qr_code_base64: str) -> bytes:
        """
        Generate an official Ministry of Lands title deed PDF
        
        Args:
            document_data: Document details (owner, plot, location, etc.)
            qr_code_base64: QR code image as base64 string
        
        Returns:
            PDF as bytes
        """
        buffer = io.BytesIO()
        
        # Create PDF document (A4 portrait)
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
        )
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#166534'),  # Dark green
            alignment=1,  # Center alignment
            spaceAfter=30,
        )
        
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.HexColor('#4B5563'),
            alignment=1,
            spaceAfter=20,
        )
        
        # Header with Ministry logo (text version for now)
        elements.append(Paragraph("UNITED REPUBLIC OF TANZANIA", title_style))
        elements.append(Paragraph("MINISTRY OF LANDS, HOUSING AND HUMAN SETTLEMENTS DEVELOPMENT", subtitle_style))
        elements.append(Spacer(1, 20))
        
        # Title
        elements.append(Paragraph("CERTIFICATE OF TITLE", ParagraphStyle(
            'Title',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#166534'),
            alignment=1,
            spaceAfter=30,
        )))
        
        # Document details table
        data = [
            ['RECORD DETAILS', ''],
            ['Record ID:', document_data.get('record_id', 'N/A')],
            ['Plot Number:', document_data.get('plot_number', 'N/A')],
            ['Owner Name:', document_data.get('owner', 'N/A')],
            ['Location:', document_data.get('location', 'N/A')],
            ['Area (sq meters):', str(document_data.get('area', 'N/A'))],
            ['Region:', document_data.get('region', 'N/A')],
            ['District:', document_data.get('district', 'N/A')],
            ['Date Issued:', datetime.now().strftime('%d/%m/%Y')],
        ]
        
        # Create table
        table = Table(data, colWidths=[150, 250])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#166534')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F3F4F6')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#D1D5DB')),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 30))
        
        # QR Code Section
        elements.append(Paragraph("VERIFICATION QR CODE", ParagraphStyle(
            'QRTitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#166534'),
            alignment=1,
            spaceAfter=10,
        )))
        
        # Decode and add QR code
        if qr_code_base64:
            qr_data = base64.b64decode(qr_code_base64)
            qr_buffer = io.BytesIO(qr_data)
            
            # Create ReportLab Image
            qr_img = Image(qr_buffer, width=2*inch, height=2*inch)
            qr_img.hAlign = 'CENTER'
            elements.append(qr_img)
        
        elements.append(Spacer(1, 20))
        
        # Digital Fingerprint Section
        elements.append(Paragraph("DIGITAL FINGERPRINT (SHA-256)", ParagraphStyle(
            'FingerprintTitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#4B5563'),
            alignment=1,
            spaceAfter=5,
        )))
        
        fingerprint_text = document_data.get('fingerprint', 'N/A')
        elements.append(Paragraph(
            f"<font size='8'>{fingerprint_text}</font>",
            ParagraphStyle('Fingerprint', parent=styles['Normal'], alignment=1)
        ))
        elements.append(Spacer(1, 20))
        
        # Security Features Notice
        security_text = """
        This document is protected by FinGuard-AI Digital Trust Framework.
        Any alteration to this document will invalidate the digital fingerprint.
        Verify authenticity by scanning the QR code or visiting verify.lands.go.tz
        """
        
        elements.append(Paragraph(security_text, ParagraphStyle(
            'Security',
            parent=styles['Italic'],
            fontSize=9,
            textColor=colors.HexColor('#6B7280'),
            alignment=1,
        )))
        
        # Footer
        elements.append(Spacer(1, 30))
        footer_text = f"Generated by FinGuard-AI v1.0 | Ministry of Lands Tanzania | {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        elements.append(Paragraph(footer_text, ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#9CA3AF'),
            alignment=1,
        )))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF value
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    @staticmethod
    def generate_security_stamp(document_data: dict) -> bytes:
        """
        Generate a security stamp with hidden steganographic data
        (Future enhancement based on documentation)
        """
        # Placeholder for GAN-based steganography
        pass
    
    @staticmethod
    def embed_in_pdf_metadata(pdf_bytes: bytes, fingerprint: str) -> bytes:
        """
        Embed fingerprint in PDF metadata
        """
        # Simple metadata embedding (future enhancement)
        return pdf_bytes