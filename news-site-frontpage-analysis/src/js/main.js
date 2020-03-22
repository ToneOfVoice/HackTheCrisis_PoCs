async function getRating(element) {
    const site = element.id;
    if (site === undefined) {
        return;
    }
    const request = new XMLHttpRequest();
    const url = '/ratings/' + site;
    request.open("GET", url);
    request.onload = function() {
        if (request.status === 200) {
            let bar_class="positive";
            let bar_length = parseFloat(request.response);
            if (parseFloat(request.response) < 0) {
                bar_class = "negative";
                bar_length = -bar_length;
            }
            element.innerHTML = request.response;
            document.getElementById(site + "-bars").innerHTML = "<span style=\"width: " + (bar_length * 100) + "px\" class=\""
                + bar_class + "\"></span>";

        } else {
            console.log("Sentiment valuation failed with error code " + request.status);
            console.log('Request: ', request);
        }
    };
    request.send(JSON.stringify(null));
}


async function ready() {
    const data = document.getElementsByClassName("article-rating");
    for (let elem of data) {
        await getRating(elem);
    }
}

document.addEventListener("DOMContentLoaded", ready);