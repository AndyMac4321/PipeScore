FROM node:18-alpine AS nodejs_builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run buildcontainer
# RUN sass src/styles/:public/styles
RUN ls .

# Base image
FROM python:3.9-slim
# Working directory
WORKDIR /app
# Copy requirements file and install dependencies
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "build/__main__.py"]

# Copy the rest of the project files
COPY . .
COPY --from=nodejs_builder /app/public/dist ./public/dist
#COPY --from=nodejs_builder /app/public/styles ./public/styles
RUN ls ./public
RUN ls ./public/dist
# RUN ls ./public/styles

WORKDIR /app/public/
# Expose the server port
EXPOSE 8080

# Command to start the server
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]