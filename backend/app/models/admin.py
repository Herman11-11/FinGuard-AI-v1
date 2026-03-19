from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.database import get_db, Document
from fastapi.responses import HTMLResponse

router = APIRouter()

@router.get("/admin/database-view", response_class=HTMLResponse)
async def database_viewer(db: Session = Depends(get_db)):
    """Simple web page to view database contents"""
    documents = db.query(Document).order_by(Document.created_at.desc()).limit(50).all()
    
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>FinGuard-AI Database Viewer</title>
        <style>
            body { font-family: Arial; margin: 20px; background: #f5f5f5; }
            h1 { color: #166534; }
            table { border-collapse: collapse; width: 100%; background: white; }
            th { background: #166534; color: white; padding: 10px; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background: #f9f9f9; }
            .stats { background: white; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        </style>
    </head>
    <body>
        <h1>📊 FinGuard-AI Database Viewer</h1>
    """
    
    # Stats
    total = db.query(Document).count()
    today = len([d for d in documents if d.created_at.date() == datetime.now().date()])
    
    html += f"""
        <div class="stats">
            <strong>Total Documents:</strong> {total} | 
            <strong>Showing:</strong> Last 50 | 
            <strong>Today:</strong> {today}
        </div>
        <table>
            <tr>
                <th>ID</th>
                <th>Record ID</th>
                <th>Owner</th>
                <th>Plot Number</th>
                <th>Location</th>
                <th>Area</th>
                <th>Region</th>
                <th>Created</th>
                <th>Fingerprint</th>
            </tr>
    """
    
    for doc in documents:
        html += f"""
            <tr>
                <td>{doc.id}</td>
                <td><strong>{doc.record_id}</strong></td>
                <td>{doc.owner_name}</td>
                <td>{doc.plot_number}</td>
                <td>{doc.location}</td>
                <td>{doc.area}</td>
                <td>{doc.region}</td>
                <td>{doc.created_at.strftime('%Y-%m-%d %H:%M')}</td>
                <td><small>{doc.document_hash[:20]}...</small></td>
            </tr>
        """
    
    html += """
        </table>
    </body>
    </html>
    """
    
    return html