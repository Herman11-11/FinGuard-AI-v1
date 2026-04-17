"""
Steganography Service for FinGuard-AI
Hides fingerprint data inside document images using LSB technique
"""

import cv2
import numpy as np
import io
import json
import hashlib
import base64
from datetime import datetime
import os

class SteganographyService:
    """Hide and extract verification data inside document images"""
    
    @staticmethod
    def embed_data(image_bytes: bytes, data: dict) -> bytes:
        """
        Hide data inside image using LSB (Least Significant Bit)
        
        Args:
            image_bytes: Original image as bytes
            data: Dictionary to hide (fingerprint, record_id, etc.)
        
        Returns:
            Image with hidden data (looks identical)
        """
        try:
            # Convert bytes to image
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                print("Failed to decode image")
                return image_bytes
            
            # Prepare data with timestamp
            data_to_hide = {
                "record_id": data.get("record_id", ""),
                "fingerprint": data.get("fingerprint", ""),
                "full_document_hash": data.get("full_document_hash", data.get("fingerprint", "")),
                "file_hash": data.get("file_hash", ""),
                "metadata_hash": data.get("metadata_hash", ""),
                "ai_signature": data.get("ai_signature", ""),
                "payload_type": data.get("payload_type", "document_trust_bundle"),
                "owner": data.get("owner", ""),
                "plot": data.get("plot", ""),
                "location": data.get("location", ""),
                "timestamp": datetime.now().isoformat(),
                "version": "FinGuard-AI"
            }
            
            # Convert to JSON string
            json_str = json.dumps(data_to_hide)
            
            # Add checksum for verification
            checksum = hashlib.md5(json_str.encode()).hexdigest()[:8]
            final_str = json.dumps({"data": data_to_hide, "checksum": checksum})
            
            # Convert to binary
            binary_data = SteganographyService._text_to_bits(final_str)
            binary_data += '1111111111111110'  # End marker
            
            # Embed data in image
            data_idx = 0
            data_len = len(binary_data)
            h, w, c = img.shape
            
            for i in range(h):
                for j in range(w):
                    for k in range(3):  # RGB channels
                        if data_idx < data_len:
                            # Modify LSB (Least Significant Bit)
                            img[i, j, k] = (img[i, j, k] & 0xFE) | int(binary_data[data_idx])
                            data_idx += 1
                        else:
                            break
                    if data_idx >= data_len:
                        break
                if data_idx >= data_len:
                    break
            
            # Convert back to bytes
            _, buffer = cv2.imencode('.png', img)
            return buffer.tobytes()
            
        except Exception as e:
            print(f"Steganography error: {e}")
            return image_bytes
    
    @staticmethod
    def extract_data(image_bytes: bytes) -> dict:
        """
        Extract hidden data from image
        
        Returns:
            Hidden data dictionary or None
        """
        try:
            # Convert bytes to image
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                return None
            
            # Extract LSBs
            bits = ""
            h, w, c = img.shape
            
            for i in range(h):
                for j in range(w):
                    for k in range(3):
                        bits += str(img[i, j, k] & 1)
            
            # Find end marker
            end_marker = '1111111111111110'
            end_pos = bits.find(end_marker)
            
            if end_pos == -1:
                return None
            
            # Extract data bits
            data_bits = bits[:end_pos]
            
            # Convert bits to text
            text = SteganographyService._bits_to_text(data_bits)
            
            # Parse JSON
            hidden = json.loads(text)
            
            # Verify checksum
            stored_checksum = hidden.get("checksum")
            actual_data = hidden.get("data")
            
            if actual_data and stored_checksum:
                json_str = json.dumps(actual_data)
                calc_checksum = hashlib.md5(json_str.encode()).hexdigest()[:8]
                
                if calc_checksum == stored_checksum:
                    return actual_data
            
            return None
            
        except Exception as e:
            print(f"Extraction error: {e}")
            return None
    
    @staticmethod
    def _text_to_bits(text: str) -> str:
        """Convert text to binary string"""
        return ''.join(format(ord(char), '08b') for char in text)
    
    @staticmethod
    def _bits_to_text(bits: str) -> str:
        """Convert binary string to text"""
        chars = []
        for i in range(0, len(bits), 8):
            byte = bits[i:i+8]
            if len(byte) == 8:
                chars.append(chr(int(byte, 2)))
        return ''.join(chars)
    
    @staticmethod
    def verify_image(image_bytes: bytes, expected_fingerprint: str) -> bool:
        """Check if image contains correct fingerprint"""
        hidden = SteganographyService.extract_data(image_bytes)
        return hidden and hidden.get("fingerprint") == expected_fingerprint

    @staticmethod
    def embed_fingerprint(image_bytes: bytes, data: dict) -> bytes:
        """Compatibility wrapper for existing document flow."""
        return SteganographyService.embed_data(image_bytes, data)

    @staticmethod
    def extract_fingerprint(image_bytes: bytes) -> dict:
        """Compatibility wrapper for existing document flow."""
        return SteganographyService.extract_data(image_bytes)
