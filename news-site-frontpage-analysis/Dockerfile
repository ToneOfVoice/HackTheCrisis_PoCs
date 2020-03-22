FROM rust as builder
RUN apt update && apt install -y python3 python3-dev python3-pip python3-setuptools build-essential wget


FROM builder as builder-dependent
WORKDIR /deps

# setuptools-rust
RUN wget -O /tmp/setuptools-rust.zip https://github.com/PyO3/setuptools-rust/archive/master.zip
RUN unzip /tmp/setuptools-rust.zip
RUN cd setuptools-rust-master && python3 setup.py install

RUN wget -O /tmp/transformers.zip https://github.com/huggingface/transformers/archive/master.zip 
RUN unzip /tmp/transformers.zip
RUN cd transformers-master && python3 setup.py install


FROM builder-dependent as app-dependent
COPY requirements.txt .
RUN pip3  --no-cache-dir install -r requirements.txt


FROM app-dependent as app-cached
WORKDIR /app
COPY src/init.py .
RUN python3 init.py


FROM app-cached as base
COPY src/main.py /app/main.py
COPY src/js /app/js
EXPOSE 5000
WORKDIR /app
ENV FLASK_APP=main.py
ENTRYPOINT ["python3", "-m", "flask", "run", "--host=0.0.0.0"]
