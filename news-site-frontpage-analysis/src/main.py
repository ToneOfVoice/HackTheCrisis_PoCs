import time

from newscatcher import Newscatcher
import pprint
from transformers import pipeline
from flask import Flask, jsonify, abort, send_from_directory
from cachetools import cached, LRUCache, TTLCache
from html.parser import HTMLParser
import threading
import logging


logger = logging.getLogger("sentiment-api")
logging.basicConfig(level=logging.DEBUG)

app = Flask('sentiment-api')

pp = pprint.PrettyPrinter(indent=4)


SITES_RATED = [
    "bbc.co.uk",
    "dailymail.co.uk",
    "nytimes.com",
    "foxnews.com",
    "nbcnews.com",
    "washingtonpost.com",
    "theguardian.com",
    "abcnews.go.com",
    "latimes.com",
]

ALLOWED_SITES = SITES_RATED + [
    "bbc.com",
]


RANKINGS = {}


class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs= True
        self.fed = []

    def handle_data(self, d):
        self.fed.append(d)

    def get_data(self):
        return ''.join(self.fed)


@cached(cache=TTLCache(maxsize=8192, ttl=86400))
def get_site_article_rating(site):
    news_source = Newscatcher(site)

    sentiment_analyzer = pipeline(task="sentiment-analysis", framework='pt', device=-1)

    data = []

    for x in news_source.news:
        s = MLStripper()
        s.feed(x['summary_detail']['value'])
        news = s.get_data()
        title = x['title']
        link = x['link']
        logger.debug(news)
        res = sentiment_analyzer(news)
        logger.debug("%s: %s: %s", site, news, res)

        data.append({"link": link, "title": title, "summary": news, "sentiment": str(res[0]["label"]),
                     "confidence": float(res[0]["score"])})

    return data


def fetch_site_rating(site):
    """
    Get site rating (-1 means all negative, +1 means all positive)
    :param site: site to check
    :return: site rating index
    """
    ratings = get_site_article_rating(site)
    positive = 0.0
    negative = 0.0
    for rating in ratings:
        if rating['sentiment'] == "POSITIVE":
            positive += 1 * rating['confidence']
        else:
            negative += 1 * rating['confidence']
    logger.info("%s: Positive: %.2f, negative: %.2f" % (site, positive, negative))
    RANKINGS[site] = (positive - negative) / (positive + negative)
    return RANKINGS[site]


def get_site_rating(site):
    return RANKINGS.get(site, None)


@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)


@app.route("/")
def index():
    out = """
    <html>
    <head>
    <script src="/js/main.js"></script>
        <style>
    span.positive {
        display: block;
        background-color: #00bb00;
        height: 1em;
        margin-left: 100px;
        border-left: 2px solid black;
    }
    span.negative {
        display: block;
        background-color: #ff0000;
        height: 1em;
        margin-right: 100px;
        float: right;
        border-right: 2px solid black;
    }
    div.bars {
        height: 1em;
        background-color: #eeeeee;
        width: 200px;
    }

    </style>
    <title>Front page sentiment analysis ratings of news sites</title>
    </head>
    <body>
    <h1>Front page sentiment analysis ratings of news sites</h1>
    <p>An index and a compensation model (like the CO2 compensation) for emotional & mental climate which is largely 
    influenced by negative media content. A tool for analysing, assessing & ranking medias according to their 
    tone of voice, negativity impact and contribution to polarisation.</p>
    <p>Made as a part of <a href="https://www.hackthecrisisfinland.com/">hackthecrisisfinland.com</a> hackathon.</a>
        <table>
        <tr><th>Domain</th><th>rating</th><th>-1 all negative, +1 all positive</th></tr>
    """

    for site in SITES_RATED:
        out += """
        <tr><td><a href=\"https://%s/\">%s</td>
        <td class=\"article-rating\" id=\"%s\">loading</td>
        <td><div class=\"bars\" id=\"%s-bars\"></div></td></tr>""" % (
            site, site, site, site)

    out += """
        </table>
    </body>
    </html>"""
    return out


@app.route("/ratings/<site>")
def site_rating(site):
    if site not in SITES_RATED:
        abort(404)
    rating = get_site_rating(site)
    if rating is None:
        abort(503)
    return "%.2f" % rating


@app.route('/favicon.ico')
def favicon():
    abort(404)


def prepopulate_index():
    while True:
        for site in SITES_RATED:
            try:
                fetch_site_rating(site)
            except Exception as exc:
                logger.exception("Error occurred while updating data")
        time.sleep(3600)


threading.Thread(target=prepopulate_index).start()


if __name__ == '__main__':
    get_site_rating("bbc.com")
