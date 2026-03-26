FROM node:18-alpine AS nodejs_builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run buildcontainer
RUN ls .

# Base image
FROM python:3.9-slim
# Working directory
# WORKDIR /app
# Copy requirements file and install dependencies
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN  python build
RUN  sass src/styles/:public/styles

# Copy the rest of the project files
RUN ls ./public
WORKDIR /app/public/
# Expose the server port
EXPOSE 8080

# Command to start the server
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]