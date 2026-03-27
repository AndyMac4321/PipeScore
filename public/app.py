import os.path
import logging
import re
from flask import Flask, Response, send_from_directory,render_template

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.config.from_object(__name__)

        
def root_dir():  # pragma: no cover
    return os.path.abspath(os.path.dirname(__file__))

@app.route('/', defaults={'path': 'index.htm'})

@app.route('/<path:path>')
def serve_page(path):
    # logging.debug(path)
    if path.startswith("pipescre"):
        path = "pipescre.htm"
    elif "." not in re.search("(.*?)$", path).group(0):
        path += ".htm"
    return send_from_directory(app.root_path, path)

if __name__ == '__main__':  # pragma: no cover
    app.run(port=8080)
