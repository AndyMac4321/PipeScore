# Base Image
FROM python:3.9-slim

# Work directory
WORKDIR /

# Copy requirements and install dependencies
COPY public/requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy other project files
COPY ./public .

# Expose a port to Containers 
EXPOSE 8080

# Command to run on server
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]