import os
import joblib
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, Request
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

server = FastAPI()

MODEL_PATH = "model.joblib"


def create_default_model():
    """
    Creates a default model with initial data if model.joblib does not exist.
    """
    data = [
        {"exercise": 1, "code": "SELECT * FROM students;", "grade": 100},
        {"exercise": 1, "code": "SELECT * FROM tudents", "grade": 90},
        {"exercise": 2, "code": "SELECT name FROM students;", "grade": 100},
        {"exercise": 2, "code": "SELECT * FROM students", "grade": 65},
    ]
    df = pd.DataFrame(data)

    preprocessor = ColumnTransformer(
        transformers=[
            ("code", CountVectorizer(ngram_range=(1, 3)), "code"),
            ("exercise", "passthrough", ["exercise"]),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", LinearRegression()),
        ]
    )

    X = df[["exercise", "code"]]
    y = df["grade"]

    pipeline.fit(X, y)

    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


# Load model or create default if missing
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
else:
    print("⚠ model.joblib missing — creating default model...")
    model = create_default_model()
    print("✓ model.joblib created.")


@server.post("/inference-api/predict")
async def predict(request: Request):
    data = await request.json()

    input_df = pd.DataFrame({
        "exercise": [data.get("exercise")],
        "code": [data.get("code")],
    })

    prediction = model.predict(input_df)[0]

    return {"prediction": prediction}


@server.post("/inference-api/train")
async def train(request: Request):
    """
    Accepts a list of training data in the form:
    [
        {"exercise": number, "code": "string", "grade": number}, ...
    ]
    """
    data = await request.json()
    if not isinstance(data, list):
        return {"status": "Invalid input: expected a list of dicts"}

    df = pd.DataFrame(data)
    if "exercise" not in df.columns or "code" not in df.columns or "grade" not in df.columns:
        return {"status": "Invalid input: missing required columns (exercise, code, grade)"}

    preprocessor = ColumnTransformer(
        transformers=[
            ("code", CountVectorizer(ngram_range=(1, 3)), "code"),
            ("exercise", "passthrough", ["exercise"]),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", LinearRegression()),
        ]
    )

    X = df[["exercise", "code"]]
    y = df["grade"]

    pipeline.fit(X, y)

    # Save new model
    joblib.dump(pipeline, MODEL_PATH)

    # Update the in-memory model
    global model
    model = pipeline

    return {"status": "Model trained successfully"}
