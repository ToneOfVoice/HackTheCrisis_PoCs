// This is a Proof of Concept for news article analysis
// You need Azure NLP Sentiment Analysis endpoint API key and
// endpoint URL to to get this thing working.

var assessText = (function () {
    const url = 'enpoint_URL';
    const subKey = "your_API_key";
    let text;
    let articleNode;

    function showVisualResult(pos, neu, neg) {
        let articleSentiment;

        if (pos > neu && pos > neg) {
            articleSentiment = 'POSITIVE';
        } else if (neu > pos && neu > neg) {
            articleSentiment = 'NEUTRAL';
        } else if (neg > pos && neg > neu) {
            articleSentiment = 'NEGATIVE';
        } else {
            articleSentiment = 'MIXED';
        }
        let sentimentContainer = document.createElement('div');
        sentimentContainer.style.display = 'flex';
        sentimentContainer.style.flexDirection = 'column';
        sentimentContainer.style.height = '70px';
        sentimentContainer.style.width = '100%';

        let sentimentHeadline = document.createElement('div');
        sentimentHeadline.style.display = 'flex';
        sentimentHeadline.style.flexDirection = 'row';
        sentimentHeadline.style.height = '30%';
        sentimentHeadline.style.width = '100%';
        sentimentHeadline.textContent = 'Article tone is ' + articleSentiment;
        sentimentHeadline.style.fontSize = '20px';

        let sentimentBar = document.createElement('div');
        sentimentBar.style.display = 'flex';
        sentimentBar.style.flexDirection = 'row';
        sentimentBar.style.height = '70%';
        sentimentBar.style.width = '100%';

        let posBar = document.createElement('div');
        posBar.style.backgroundColor = 'green';
        posBar.style.width = pos.toString() + '%';
        posBar.textContent = 'Positive\n' + pos.toFixed(2) + '%';
        posBar.style.fontSize = '20px';
        posBar.style.textAlign = 'center';
        
        let neuBar = document.createElement('div');
        neuBar.style.backgroundColor = 'yellow';
        neuBar.style.width = neu.toString() + '%';
        neuBar.textContent = 'Neutral\n' + neu.toFixed(2) + '%';
        neuBar.style.fontSize = '20px';
        neuBar.style.textAlign = 'center';

        let negBar = document.createElement('div');
        negBar.style.backgroundColor = 'red';
        negBar.style.width = neg.toString() + '%';
        negBar.textContent = 'Negative\n' + neg.toFixed(2) + '%';
        negBar.style.fontSize = '20px';
        negBar.style.textAlign = 'center';

        sentimentContainer.appendChild(sentimentHeadline);
        sentimentContainer.appendChild(sentimentBar);

        sentimentBar.appendChild(posBar);
        sentimentBar.appendChild(neuBar);
        sentimentBar.appendChild(negBar);

        articleNode.insertBefore(sentimentContainer, articleNode.firstChild);
    }

    function showSentiment(res) {
        console.log('res pituus:', JSON.parse(res));
        const result = JSON.parse(res);

        let pos = 0;
        let neu = 0;
        let neg = 0;

        for (let i = 0; i < result.documents.length; i++) {
            let doc = result.documents[i];
            let positive = 0;
            let neutral = 0;
            let negative = 0;  

            for (let idx = 0; idx < doc.sentences.length; idx++) {
                let sentence = doc.sentences[idx];

                positive = (positive + sentence.sentenceScores.positive);
                neutral = (neutral + sentence.sentenceScores.neutral);
                negative = (negative + sentence.sentenceScores.negative);
            }

            pos = (pos + (positive / doc.sentences.length));
            neu = (neu + (neutral / doc.sentences.length));
            neg = (neg + (negative / doc.sentences.length));
        }

        pos = (pos / result.documents.length) * 100;
        neu = (neu / result.documents.length) * 100;
        neg = (neg / result.documents.length) * 100;

        console.log('totalPositive: ', pos);
        console.log('totalNeutral: ', neu);
        console.log('totalNegative: ', neg);

        showVisualResult(pos, neu, neg);
    }

    function evaluateText() {
        // console.log('selected text: ', text);
        const choppedStringArray = text.match(/.{1,5000}/g);
        const body = {
            "documents": []
        }

        for(var i = 0; i < Math.min(choppedStringArray.length, 50); i++) {
            const txt = {
                "countryHint": "US",
                "id": i+1,
                "text": choppedStringArray[i]
            }
            body.documents.push(txt);
        }

        const request = new XMLHttpRequest();
        request.open("POST", url);
        request.setRequestHeader("Content-Type", "application/json");
        request.setRequestHeader("Ocp-Apim-Subscription-Key", subKey);
        request.onload = function() {
            if (request.status === 200) {
                let response = request.response;
                // console.log("Sentiment valuated successfully", response);
                showSentiment(response);
            } else {
                console.log("Sentiment valuation failed with error code " + request.status);
                console.log('Request: ', request);
            }
        };
        request.send(JSON.stringify(body));
    }

    function readText(elem) {
        let output = "";
        for (let i in elem.childNodes) {
            let child = elem.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE) {
                output += " " + child.textContent;
            } else if (child.classList && child.classList.contains('billboard_wrapper')) {
                continue;
            } else if (child.classList && child.classList.contains('mol-video')) {
                continue;
            } else if (child.classList && child.classList.contains('adHolder')) {
                continue;
            } else if (child.classList && child.classList.contains('mol-img-group')) {
                continue;
            } else if (child.classList && child.classList.contains('related-carousel')) {
                continue;
            } else if (child.classList && child.classList.contains('articleComments')) {
                continue;
            } else if (child.classList && child.classList.contains('tbl-feed-container')) {
                continue;
            } else if (child.classList && child.classList.contains('column-content cleared')) {
                continue;
            } else if (child.classList && child.classList.contains('shareArticles')) {
                continue;
            } else if (child.id === 'articleIconLinksContainer') {
                continue;
            } else if (child.id === 'external-source-links') {
                continue;
            } else if (child.id === 'taboola-below-article-thumbnails') {
                continue;
            } else if (child.id === 'most-watched-videos-lazy-container') {
                continue;
            } else if (child.id === 'infinite-list') {
                continue;
            } else if (child.id === 'footer') {
                continue;
            } else if (child.tagName === 'IMG') {
                continue;
            } else if (child.tagName === 'SCRIPT') {
                continue;
            } else if (child.tagName === 'STYLE') {
                continue;
            } else if (child.tagName === 'IFRAME') {
                continue;
            } else {
                output += readText(child);
            }
        }
        return output.trim();
    }

    function start() {
        let articlesXPathResult = document.evaluate("//article", document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        articleNode = articlesXPathResult.snapshotItem(0);

        if (!articleNode) {
            articleNode = document.getElementById('content');
        }

        let textBody = document.evaluate(".//*[contains(@itemprop,'articleBody')]", articleNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (!textBody) {
            textBody = document.evaluate(".//*[contains(@class,'article-body')]", articleNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }

        text = readText(textBody);

        evaluateText();

    }
    return {
        "start": start
    }
})();
    assessText.start();
