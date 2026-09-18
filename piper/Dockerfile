FROM python:3.12-slim
RUN pip install --no-cache-dir "piper-tts[http]"
ARG VOICES="pl_PL-gosia-medium pl_PL-darkman-medium pl_PL-mc_speech-medium en_US-lessac-medium en_US-ryan-medium de_DE-thorsten-medium es_ES-davefx-medium ru_RU-irina-medium ru_RU-dmitri-medium"
WORKDIR /voices
RUN for voice in $VOICES; do python -m piper.download_voices --data-dir /voices "$voice"; done
EXPOSE 5000
CMD ["python", "-m", "piper.http_server", "--host", "0.0.0.0", "--port", "5000", "--data-dir", "/voices", "-m", "pl_PL-gosia-medium"]
