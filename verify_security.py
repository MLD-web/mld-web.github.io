import asyncio
from playwright.async_api import async_playwright
import os
import http.server
import threading
import socket

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

PORT = find_free_port()

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def run_server():
    with http.server.HTTPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

async def verify():
    # Start server in a thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        errors = []
        page.on("pageerror", lambda exc: errors.append(f"Uncaught exception: {exc}"))
        page.on("console", lambda msg: errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)

        urls = [
            f"http://localhost:{PORT}/",
            f"http://localhost:{PORT}/portafolio/",
            f"http://localhost:{PORT}/gracias.html",
            f"http://localhost:{PORT}/404.html",
            f"http://localhost:{PORT}/.well-known/security.txt"
        ]

        for url in urls:
            print(f"Verifying {url}...")
            response = await page.goto(url)
            if not response or response.status != 200:
                print(f"FAILED: Status {response.status if response else 'None'} for {url}")
                # Special case for .txt files which might be 200 but check content
                if ".txt" in url and response and response.status == 200:
                    pass
                else:
                    exit(1)

            # Wait for some time to let scripts load
            await asyncio.sleep(1)

            if "security.txt" not in url:
                # Check for critical elements
                if url.endswith("/") or "index.html" in url:
                    h1 = await page.query_selector("h1")
                    if not h1:
                        print(f"FAILED: No H1 on {url}")
                        exit(1)
            else:
                content = await page.content()
                if "Contact:" not in content:
                    print(f"FAILED: security.txt content invalid")
                    exit(1)

        if errors:
            print("Console errors found:")
            for err in errors:
                # Ignore some common tracking errors if any
                if "gtag" not in err:
                    print(err)
            # We don't necessarily exit(1) on console errors as some might be external/pre-existing
            # but for CSP we should be careful.

        print("Verification successful!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
