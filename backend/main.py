from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes.waste import router as waste_router

app = FastAPI(
    title="Civic Trust AI",
    description="AI-Powered Environmental Verification Engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(waste_router)

@app.get("/")
async def root():
    return {"message": "Civic Trust AI", "version": "1.0.0"}