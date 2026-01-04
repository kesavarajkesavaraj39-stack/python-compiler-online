# 1. Use a lightweight Python version
FROM python:3.9-slim

# 2. Set the working folder
WORKDIR /app

# 3. Copy your project files
COPY . /app

# 4. Install the libraries
RUN pip install --no-cache-dir -r requirements.txt

# 5. Run the app using Gunicorn (The Production Server)
CMD ["gunicorn", "-k", "gevent", "-b", "0.0.0.0:10000", "app:app"]