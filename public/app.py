# from flask import Flask

# app = Flask(__name__)

# @app.route('/')
# def hello():
#     return "Hello Back4apper!"

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8080)

# Flask App for Azure Linux Python
# az webapp deploy --resource-group andy.macdonald_rg_7860 --name PipeScore1-AndyMac --src-path "D:\My Virtual Machines\Temporary\public.zip"
import os.path
import logging
import re
from flask import Flask, Response, send_from_directory

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.config.from_object(__name__)

        
def root_dir():  # pragma: no cover
    return os.path.abspath(os.path.dirname(__file__))

@app.route('/test')
def hello():
    return "Hello Back4apper!"

@app.route('/', defaults={'path': 'index.html'})

@app.route('/<path:path>')
def serve_page(path):
    logging.debug(path)
    if path.startswith("pipescore"):
        path = "pipescore.html"
    elif "." not in re.search("(.*?)$", path).group(0):
        path += ".html"
    return send_from_directory('', path)


if __name__ == '__main__':  # pragma: no cover
    app.run(port=8080)
