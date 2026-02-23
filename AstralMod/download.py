import requests
import os

gif_url = "https://share.creavite.co/699b98a46055565268fa168c.gif"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print("Downloading GIF from:", gif_url)

response = requests.get(gif_url, headers=headers)
response.raise_for_status()

content_type = response.headers.get("Content-Type", "")

if "image" in content_type or response.content[:6] in (b"GIF87a", b"GIF89a"):
    output_filename = "creavite_output.gif"
    with open(output_filename, "wb") as f:
        f.write(response.content)
    print("Downloaded GIF as", output_filename)
else:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(response.text, "html.parser")
    img_tag = soup.find("img")
    if not img_tag or not img_tag.get("src"):
        raise Exception("Could not find GIF URL inside the page")
    actual_gif_url = img_tag["src"]
    if actual_gif_url.startswith("/"):
        actual_gif_url = "https://share.creavite.co" + actual_gif_url
    print("Found GIF:", actual_gif_url)
    gif_data = requests.get(actual_gif_url, headers=headers).content
    output_filename = "creavite_output.gif"
    with open(output_filename, "wb") as f:
        f.write(gif_data)
    print("Downloaded GIF as", output_filename)
