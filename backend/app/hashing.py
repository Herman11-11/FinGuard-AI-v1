import hashlib
import json
from datetime import datetime

class HashingService:
    """Creates digital fingerprints for land documents"""
    
    @staticmethod
    def generate_fingerprint(document_data):
        """
        Convert document into unique digital fingerprint
        
        Args:
            document_data: Dictionary with owner, plot, location, etc.
        
        Returns:
            64-character hexadecimal fingerprint
        """
        # Add timestamp to make it truly unique
        document_data['timestamp'] = datetime.now().isoformat()
        
        # Convert to sorted JSON string (ensures consistency)
        json_string = json.dumps(document_data, sort_keys=True)
        
        # Create SHA-256 hash
        hash_object = hashlib.sha256(json_string.encode())
        fingerprint = hash_object.hexdigest()
        
        return fingerprint
    
    @staticmethod
    def verify_document(original_fingerprint, new_document_data):
        """
        Check if document has been tampered with
        
        Returns:
            True if document is authentic, False if changed
        """
        new_fingerprint = HashingService.generate_fingerprint(new_document_data)
        return new_fingerprint == original_fingerprint

# Simple test to see it working
if __name__ == "__main__":
    # Example land document
    land_doc = {
        "owner": "Herman John",
        "plot_number": "PLT-2024-001",
        "location": "Dar es Salaam",
        "area": 500
    }
    
    # Create a copy WITHOUT changing original
    doc_for_fingerprint = land_doc.copy()
    fp = HashingService.generate_fingerprint(doc_for_fingerprint)
    print(f"🔐 Digital Fingerprint: {fp}")
    print(f"Length: {len(fp)} characters")
    
    # Test verification with SAME data
    is_valid = HashingService.verify_document(fp, land_doc.copy())
    print(f"✅ Document authentic? {is_valid}")
    
    # Now test with TAMPERED data
    tampered_doc = land_doc.copy()
    tampered_doc["owner"] = "John Herman"  # Changed name
    is_tampered = HashingService.verify_document(fp, tampered_doc)
    print(f"❌ Tampered document detected? {not is_tampered}")