FROM node:18-alpine AS nodejs_builder
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN ls .
COPY . .
RUN ls .
RUN npm run build
RUN ls .

# Base image
FROM python:3.9-slim
# Working directory
WORKDIR /app/public
# Copy requirements file and install dependencies
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project files

COPY ./public .
RUN ls .

# Expose the server port
EXPOSE 8080

# Command to start the server
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]