from fastapi import FastAPI,Request,UploadFile, File
from fastapi.responses import HTMLResponse,JSONResponse,RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import json
from pydantic import BaseModel
import matplotlib.pyplot as plt
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import pandas as pd
import io

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/user_dashboard")
def dashboard(request: Request):
    return templates.TemplateResponse("user_dashboard.html", {"request": request})



@app.get("/about", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})




@app.get("/services", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("services.html", {"request": request})




@app.get("/contact", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})



@app.get("/signup", response_class=HTMLResponse)
def signup_form(request: Request):
    return templates.TemplateResponse("signup.html", {"request": request})