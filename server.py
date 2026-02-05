from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

class Handler(SimpleHTTPRequestHandler):
    def send_error(self, code, message=None, explain=None):
        if code == 404:
            # Serve your custom 404.html
            self.send_response(404)
            self.send_header("Content-type", "text/html")
            self.end_headers()

            # Make sure 404.html exists in the project root
            if os.path.exists("404.html"):
                with open("404.html", "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"<h1>404 - Page Not Found</h1>")
        else:
            super().send_error(code, message, explain)

# Run the server
HTTPServer(("", 8000), Handler).serve_forever()
