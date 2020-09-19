from flask import Flask, render_template, request, redirect,send_from_directory

import pyaudio
import sys
import os
import numpy as np
import base64
import wave
import concurrent.futures
import matplotlib.pyplot as plt
import speech_recognition as sr
from scipy.io import wavfile as wav

app = Flask(__name__,static_url_path='')


UPLOAD_FOLDER = "./static/wavFiles"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route("/", methods=["GET", "POST"])
def index():
    transcript = ""
    if request.method == "POST":
        print("FORM DATA RECEIVED")

        if "file" not in request.files:
            return redirect(request.url)

        file = request.files["file"]
        if file.filename == "":
            return redirect(request.url)

        if file:
            # for files uploaded
            recognizer1 = sr.Recognizer()
            audioFile = sr.AudioFile(file)
            with audioFile as source:
                dataFile = recognizer1.record(source)
            transcript = recognizer1.recognize_google(dataFile, key=None)
            print(transcript)
        

    return render_template('index.html', transcript=transcript)

@app.route("/rec", methods=["GET", "POST"])
def recording():
    transcript = ""
    if request.method == "POST":
        print("FORM DATA RECEIVED")

        if "file" not in request.files:
            return redirect(request.url)

        file = request.files["file"]
        if file.filename == "":
            return redirect(request.url)

        if file:
            # for files recorded
           
            recognizer = sr.Recognizer()
            audioFile = sr.AudioFile(file)
            with audioFile as source:
                dataFile = recognizer.record(source)
            transcript = recognizer.recognize_google(dataFile, key=None)
            print(transcript)
            print("done")            

    return transcript

@app.route("/energyGraph", methods=["GET"])
def energy_graph():

    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(parallelProcessEnergyGraph, 'run')
        return_value = future.result()
       

    return return_value

def parallelProcessEnergyGraph(gg):
    file = './static/wavFiles/rec.wav'   
    _, data = wav.read(file)
    plt.plot(data)
    plt.xlabel('Sample')
    plt.ylabel('Amplitude')
    plt.title('Spectrogram of a wav file')
    plt.savefig('./static/images/graph.png', dpi=100)

    with open("./static/images/graph.png", "rb") as img_file:
        my_string = base64.b64encode(img_file.read())
    print("created graph")
    

    return my_string

if __name__ == "__main__":
    app.run(debug=True, threaded=True)