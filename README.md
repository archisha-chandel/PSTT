# PSTT- Python Speech to Text
A web application built using Flask.

## Features
1. Speech to Text Transcription:
    * Upload option- a button to upload audio file & perform transcription along with displaying it on the same page.
    * Microphone option- a button to record audio & perform transcription along with displaying it on the same page.
 2. Number of filler words displayed as a count from the transcribed text.
 3. Energy graph of the audio file.
 
 ## Implementation
 `PyAudio` and `SpeechRecognition` are the two main APIs used for implementation. `WebAudioRecorder.js` is a JavaScript library that is used here to record audio input (Web Audio API AudioNode object) and encode to audio file image (Blob object).
 
 Sample audio files are present in [wavFiles](./static/wavFiles)
