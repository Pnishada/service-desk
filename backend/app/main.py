from fastapi import FastAPI

app = FastAPI(title="NAITA Service Desk")

@app.get("/")
def root():
    return {"message": "NAITA Service Desk API Running"}
