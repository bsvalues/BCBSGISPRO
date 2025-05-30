# Use official Python base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn python-multipart pandas pydantic httpx

# Create directories
RUN mkdir -p server/logs server/uploads server/static

# Copy application files
COPY server/ server/
COPY client/dist/ server/static/

# Expose port for the application
EXPOSE 8000

# Working directory for the application
WORKDIR /app/server

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]