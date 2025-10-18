# SOFTWARE-ANALYSIS-AND-DESIGN
SSTG

# Backend Setup (SCRUM-29)

## Requirements
- Python 3.11+
- Virtual environment

## Setup Instructions
```bash
git git clone git@github.com:Haytam-CB06/SOFTWARE-ANALYSIS-AND-DESIGN.git
cd SOFTWARE-ANALYSIS-AND-DESIGN
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main_app:app --reload --port 8000
