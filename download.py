import json
import re

import requests

BASE_URL = r"https://www.worldometers.info/coronavirus/country/{country}/"
COUNTRIES = {
    "netherlands": "The Netherlands",
    "italy": "Italy",
    "germany": "Germany",
    "belgium": "Belgium",
    "france": "France",
}

def parse_data(country):
    url = BASE_URL.format(country=country)

    doc = requests.get(url)
    if doc.status_code != 200:
        raise Exception(f"Could not download from URL: {url}")

    match = re.search(
        r"coronavirus-cases-linear'([^;]*)\}\);", doc.content.decode("utf8"), re.DOTALL
    )
    if not match:
        raise Exception(f"Cannot find graph for cases.")
    snippet = match.group(0)

    match = re.search(r"categories: \[([^\]]*)\]", snippet)
    if not match:
        raise Exception(f"Cannot find dates in graph for cases.")
    dates = [el.strip('"') for el in match.group(1).split(",")]

    match = re.search(r"data: \[([^\]]*)\]", snippet)
    if not match:
        raise Exception(f"Cannot find data in graph for cases.")
    cases = list(map(int, match.group(1).split(",")))

    if len(cases) != len(dates):
        raise Exception(f"Inconsistent data found.")

    result = {
        "dates": dates,
        "cases": cases,
    }

    return result


if __name__ == "__main__":

    print("Downloading...")

    stats = []

    for country_slug, country_name in COUNTRIES.items():
        print(f"{country_name}... ", end="")
        try:
            result = parse_data(country_slug)
        except Exception as e:
            print(f"Error: {e}")
            continue
        stats.append({
            "name": country_name,
            "data": result,
        })
        print("OK")

    with open(f"data/stats.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(stats))

    print("Done.")
