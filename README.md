# Smart Study Timetable Generator  
**Project:** SOFTWARE-ANALYSIS-AND-DESIGN  

---

## ⚙️ Setup Virtual Environment & Dependencies (SCRUM-29)

**Team Role:** Backend Developer / QA & Documentation  

### Requirements
- Python 3.11+
- Google Cloud Project (with Calendar API enabled)
- `client_secret.json` file (OAuth 2.0 credentials)

### Setup Instructions
```bash
git clone git@github.com:Haytam-CB06/SOFTWARE-ANALYSIS-AND-DESIGN.git
cd SOFTWARE-ANALYSIS-AND-DESIGN
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main_app:app --reload --port 8000
```

