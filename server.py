from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404:
            self.send_response(404)
            self.send_header("Content-type", "text/html")
            self.end_headers()

            if os.path.exists("404.html"):
                with open("404.html", "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"<h1>404 - Page Not Found</h1>")
        else:
            super().send_error(code, message, explain)

port = int(os.environ.get("PORT", 5000))
print(f"Server running on port {port}")
HTTPServer(("0.0.0.0", port), Handler).serve_forever()
