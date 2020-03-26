# 
# Generates a JSON file with Corona statistics.
#
# Example::
#
# {
#     "charts": {"cases": "Cases", ...},
#     "countries": {"netherlands": "The Netherlands", ...},
#     "datasets": [{
#         "country": "netherlands",
#         "data": [{
#             "chart": "cases",
#             "dates": ["Feb 15", ...],
#             "values": [0, 1, 2, ...]
#         }]
#     }]
# }
#
import json
import re

import requests

BASE_URL = r"https://www.worldometers.info/coronavirus/country/{country}/"
COUNTRIES = {
    # key   : Country slug used in the BASE_URL
    # value : Pretty country name
    "netherlands": "The Netherlands",
    "italy": "Italy",
    "germany": "Germany",
    "belgium": "Belgium",
    "france": "France",
}
CHARTS = {
    # key   : Chart ID on the website
    # value : Pretty chart name
    "coronavirus-deaths-linear": "Deaths",
    "coronavirus-cases-linear": "Cases",
}


def parse_data(document, chart_id):
    match = re.search(
        chart_id + r"'([^;]*)\}\);", doc.content.decode("utf8"), re.DOTALL
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
    values = list(map(int, match.group(1).split(",")))

    if len(values) != len(dates):
        raise Exception(f"Inconsistent data found.")

    return {"chart": chart_id, "dates": dates, "values": values}


if __name__ == "__main__":

    print("Downloading...")

    # General JSON-layout
    result = {
        "charts": CHARTS,
        "countries": COUNTRIES,
        "datasets": [],
    }

    for country_slug, country_name in COUNTRIES.items():
        print(f"{country_name}... ", end="")

        chart_data = []

        try:
            url = BASE_URL.format(country=country_slug)

            doc = requests.get(url)
            if doc.status_code != 200:
                raise Exception(f"Could not download from URL: {url}")

            for chart_id, chart_name in CHARTS.items():
                chart_data.append(parse_data(doc, chart_id))
        except Exception as e:
            print(f"Error: {e}")
            continue

        result["datasets"].append({"country": country_slug, "data": chart_data})
        print("OK")

    with open(f"data/stats.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(result))

    print("Done.")
