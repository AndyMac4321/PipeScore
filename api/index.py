from http.server import BaseHTTPRequestHandler
import re 
class handler(BaseHTTPRequestHandler):
 
    
    def do_GET(self):
        if self.path.startswith("/pipescore"):
            self.path = "/pipescore.html"
        elif self.path == "/":
            self.path = "/index.html"

        return super().do_GET()
