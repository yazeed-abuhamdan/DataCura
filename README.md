# Data Cura

Welcome to **Data Cura**, an AI-powered automated data cleaning tool built with React, TypeScript, Vite, Tailwind CSS, and Framer Motion.

This repository serves as a beta prototype demonstrating how user datasets can be intelligently parsed, profiled, cleaned, and exported, directly within the browser, coupled with an actual standalone Python implementation of the AI logic.

## Project Structure

- `frontend/`: The React application with a fully mocked, browser-side simulation of the AI functionality using global state.
- `python_ai/`: The standalone Python AI module that implements the actual matching logic using Pandas and Scikit-learn.

## Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- `npm` or `yarn`

## Running the Frontend

The React UI runs purely locally with no backend server.

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to experience the prototype.

Features implemented:
- **Landing Page**: Animated feature showcase.
- **Upload Page**: Drag-and-drop CSV parser using `PapaParse`.
- **Profiling Page**: Generates intelligent distribution and metadata visualization using `Recharts`.
- **Cleaning Page**: Intelligent heuristic-based cleaning suggestions.
- **Results Page**: Human-readable explainability reporting.
- **Export Page**: Blob-based downloads for CSV and JSON outputs.

## Running the Python AI Module

The Python module executes the mathematical logic independently to demonstrate how the brains will operate.

```bash
cd python_ai
npm install -r requirements.txt  # Or pip install -r requirements.txt
python run_demo.py
```

This script will process the included `samples/sample.csv`, report the detected issues, generate a cleaned file `samples/cleaned.csv`, and print an explainability JSON block to the terminal mimicking the response the front-end simulates.
