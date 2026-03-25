# Base Image
FROM python:3.11

# Work directory
WORKDIR /app

# Create a non-root user (recommended for security)
RUN useradd -m myuser
COPY . /app
RUN chown -R myuser:myuser /app
USER myuser

# Give read/write access
RUN chmod -R 755 /app
# OR if specific directories need write access (e.g. storage)
RUN chmod -R 755 /app/audio

# Copy requirements and install dependencies
COPY public/requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy other project files
COPY ./public .

# Expose a port to Containers 
EXPOSE 8080

# Command to run on server
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]