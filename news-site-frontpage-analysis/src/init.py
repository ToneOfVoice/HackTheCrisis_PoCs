from transformers import pipeline


if __name__ == '__main__':
    sentiment_analyzer = pipeline(task="sentiment-analysis", framework='pt', device=-1)
