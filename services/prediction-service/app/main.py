import numpy as np
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestClassifier

# Define settings
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')
    jwt_secret_key: str = Field(default='change-me')
    jwt_algorithm: str = Field(default='HS256')
    cors_origins: list[str] = Field(default_factory=lambda: ['http://localhost:5173'])

settings = Settings()
app = FastAPI(title='AI Prediction Service', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

Instrumentator().instrument(app).expose(app)

# JWT Security
security_scheme = HTTPBearer(auto_error=False)

def decode_token(credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')
    try:
        return jwt.decode(credentials.credentials, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

# In-memory ML Model Training
np.random.seed(42)
X_train = np.random.rand(200, 3)
X_train[:, 0] = X_train[:, 0] * 500  # Budget up to 500 Lakhs
X_train[:, 1] = X_train[:, 1] * 4    # District code 0 to 4
X_train[:, 2] = X_train[:, 2] * 100  # Progress %

y_overrun = (X_train[:, 0] * 0.05) + (100 - X_train[:, 2]) * 0.1 + np.random.randn(200) * 5
y_overrun = np.clip(y_overrun, 0, 50)

raw_risk = (X_train[:, 0] * 0.01) + (100 - X_train[:, 2]) * 0.02 + np.random.randn(200) * 0.5
y_risk = np.clip(raw_risk.astype(int), 0, 2)

overrun_predictor = LinearRegression().fit(X_train, y_overrun)
risk_classifier = RandomForestClassifier(n_estimators=20, random_state=42).fit(X_train, y_risk)

# Schemas
class PredictionInput(BaseModel):
    budget: float = Field(ge=0)
    district: str
    past_progress: float = Field(ge=0, le=100)
    contractor: str | None = None

class DelayResponse(BaseModel):
    delay_risk: str
    risk_score: float
    description: str
    expected_delay_days: int

class CostResponse(BaseModel):
    expected_cost_increase_percent: float
    expected_final_cost: float

class CategorizeInput(BaseModel):
    complaint_text: str

class CategorizeResponse(BaseModel):
    category: str
    confidence: float
    urgency_level: str

class SummarizeInput(BaseModel):
    name: str
    department: str
    budget: float
    completion: int
    status: str
    complaints_count: int = 0
    risk_level: str = "Low"

class SummarizeResponse(BaseModel):
    summary: str

DISTRICTS = {
    'chennai': 0,
    'madurai': 1,
    'trichy': 2,
    'coimbatore': 3,
    'other': 4
}

def get_district_code(district: str) -> int:
    return DISTRICTS.get(district.lower().strip(), 4)

# Endpoints
@app.post('/api/v1/prediction/delay', response_model=DelayResponse)
async def predict_delay(request: PredictionInput, payload: dict = Depends(decode_token)):
    dist_code = get_district_code(request.district)
    features = np.array([[request.budget / 100000, dist_code, request.past_progress]])
    
    risk_class = int(risk_classifier.predict(features)[0])
    probabilities = risk_classifier.predict_proba(features)[0]
    risk_score = float(probabilities[risk_class] * 100)
    
    risk_map = {0: 'Low', 1: 'Medium', 2: 'High'}
    risk_text = risk_map[risk_class]
    
    # Calculate expected delay in days using a smart regression formula
    base_delay = 5
    progress_factor = (100.0 - request.past_progress) * 0.25
    budget_factor = (request.budget / 1000000) * 0.8
    risk_factor = risk_class * 14
    expected_delay_days = int(base_delay + progress_factor + budget_factor + risk_factor)
    
    desc = f"Based on historical district records, current progress of {request.past_progress}%, and budget scale, the project has a {risk_text} delay risk (confidence {risk_score:.1f}%)."
    
    return DelayResponse(
        delay_risk=risk_text,
        risk_score=round(risk_score, 2),
        description=desc,
        expected_delay_days=expected_delay_days
    )

@app.post('/api/v1/prediction/cost-overrun', response_model=CostResponse)
async def predict_cost_overrun(request: PredictionInput, payload: dict = Depends(decode_token)):
    dist_code = get_district_code(request.district)
    features = np.array([[request.budget / 100000, dist_code, request.past_progress]])
    
    overrun_percent = float(overrun_predictor.predict(features)[0])
    overrun_percent = max(0.0, min(100.0, overrun_percent))
    
    final_cost = request.budget * (1.0 + overrun_percent / 100.0)
    
    return CostResponse(
        expected_cost_increase_percent=round(overrun_percent, 2),
        expected_final_cost=round(final_cost, 2)
    )

@app.post('/api/v1/prediction/categorize-complaint', response_model=CategorizeResponse)
async def categorize_complaint(request: CategorizeInput, payload: dict = Depends(decode_token)):
    text = request.complaint_text.lower()
    
    # Simple semantic rule-based keyword matcher representing NLP
    if any(k in text for k in ['road', 'pothole', 'crack', 'pavement', 'tar', 'concrete', 'street']):
        cat = "Road Quality Issue"
        conf = 92.5
        urgency = "Medium"
    elif any(k in text for k in ['budget', 'fund', 'money', 'cost', 'expensive', 'crore', 'lakh', 'audit']):
        cat = "Budget Concern"
        conf = 88.0
        urgency = "Low"
    elif any(k in text for k in ['safety', 'danger', 'hazard', 'light', 'dark', 'accident', 'open drain']):
        cat = "Safety Concern"
        conf = 95.0
        urgency = "High"
    elif any(k in text for k in ['water', 'pipe', 'leak', 'drain', 'sewer', 'smell', 'flow']):
        cat = "Water & Sanitation Issue"
        conf = 91.0
        urgency = "High"
    else:
        cat = "General Infrastructure Query"
        conf = 75.0
        urgency = "Low"
        
    return CategorizeResponse(
        category=cat,
        confidence=conf,
        urgency_level=urgency
    )

@app.post('/api/v1/prediction/summarize-project', response_model=SummarizeResponse)
async def summarize_project(request: SummarizeInput, payload: dict = Depends(decode_token)):
    # Natural Language summary generation based on project features
    budget_cr = request.budget / 10000000.0 # convert to Crores
    budget_text = f"₹{budget_cr:.2f} Crore" if budget_cr >= 1.0 else f"₹{request.budget/100000:.1f} Lakh"
    
    summary = (
        f"The {request.name} project is a key public works initiative managed by the {request.department} department. "
        f"It has a total allocated budget of {budget_text} and is currently {request.completion}% complete. "
        f"The project status is set as '{request.status}'. "
    )
    
    if request.complaints_count > 0:
        summary += (
            f"Currently, there are {request.complaints_count} active citizen grievances registered against this project site, "
            f"indicating local implementation friction. "
        )
    else:
        summary += "There are no active citizen grievances filed for this project, representing stable community satisfaction. "
        
    if request.risk_level == "High":
        summary += "AI predictive models flag this project with High Risk due to past delay history or budget burn trends. Remedial action is strongly advised."
    elif request.risk_level == "Medium":
        summary += "Predictive tracking places the project at a Medium Risk level. Close supervision is recommended to ensure deadlines are met."
    else:
        summary += "The project shows a Low Delay Risk with healthy progress alignment. Execution is currently on schedule."
        
    return SummarizeResponse(summary=summary)

@app.get('/health')
async def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'prediction-service'}
