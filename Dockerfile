# install nodejs and build pipescore
FROM node:18-alpine AS nodejs_builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run buildcontainer
RUN npx sass src/styles/:public/styles
RUN ls -R /app/public

# Base image
FROM python:3.9-slim
# Working directory
WORKDIR /app
# Copy requirements file and install dependencies
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project files
COPY . .
# Copy code build by nodejs
COPY --from=nodejs_builder /app/public/dist ./public/dist
COPY --from=nodejs_builder /app/public/styles ./public/styles

# run python build script
RUN python build
RUN ls -R /app/public

# change to public folder
WORKDIR /app/public/
# Expose the server port
EXPOSE 8080

# Command to start the server
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]