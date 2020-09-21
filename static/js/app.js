//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var recorder; //WebAudioRecorder object
var input; //MediaStreamAudioSourceNode  we'll be recording
var encodingType; //holds selected encoding for resulting audio (file)
var encodeAfterRecord = true; // when to encode

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

var encodingTypeSelect = "wav"
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
	createWaitNotification({
		position: 'top right',
		type: 'warning'
	})
	$('#recordedSpeechTranscript').attr('hidden', true);
	$('#graphContainer').attr('hidden', true);
	console.log("startRecording() called");



	/*
		Simple constraints object, for more advanced features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

	var constraints = {
		audio: true,
		video: false
	}

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		__log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML = "Format: 2 channel " + "wav" + " @ " + audioContext.sampleRate / 1000 + "kHz"

		//assign to gumStream for later use
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		//stop the input from playing back through the speakers
		//input.connect(audioContext.destination)

		//get the encoding 
		encodingType = "wav";



		recorder = new WebAudioRecorder(input, {
			workerDir: "js/", // must end with slash
			encoding: encodingType,
			numChannels: 2, //2 is the default, mp3 encoding supports only 2
			onEncoderLoading: function (recorder, encoding) {
				// show "loading encoder..." display
				__log("Loading " + encoding + " encoder...");
			},
			onEncoderLoaded: function (recorder, encoding) {
				// hide "loading encoder..." display
				__log(encoding + " encoder loaded");
				createNotification({
					position: 'top right',
					type: 'success'
				})
				$('#recordButton').html(` Record<div style="margin-bottom: 4px !important;margin-left: 2px !important;width: 1rem;height: 1rem;" class="spinner-grow text-light" role="status">
			<span class="sr-only">Loading...</span>
		  </div>`)
			}
		});

		recorder.onComplete = function (recorder, blob) {
			__log("Encoding complete");
			createDownloadLink(blob, recorder.encoding);

		}

		recorder.setOptions({
			timeLimit: 120,
			encodeAfterRecord: encodeAfterRecord,
			ogg: {
				quality: 0.5
			},
			mp3: {
				bitRate: 160
			}
		});

		//start the recording process
		recorder.startRecording();

		__log("Recording started");

	}).catch(function (err) {
		console.log(err);
		//enable the record button if getUSerMedia() fails
		recordButton.disabled = false;
		stopButton.disabled = true;

	});

	//disable the record button
	recordButton.disabled = true;
	stopButton.disabled = false;
}

function stopRecording() {
	console.log("stopRecording() called");
	$('#spinnerTrans').attr('hidden', false);
	$('#recordButton').html(`Record`)

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//disable the stop button
	stopButton.disabled = true;
	recordButton.disabled = false;

	//tell the recorder to finish the recording (stop recording + encode the recorded audio)
	recorder.finishRecording();

	__log('Recording stopped');
}

function createDownloadLink(blob, encoding) {

	let filee = new File([blob], "rec.wav");

	postData(filee);
}

//helper function
function __log(e, data) {
	log.innerHTML += "\n" + e + " " + (data || '');
}

async function postData(filee) {
	
		var fd = new FormData();
		fd.append('file', filee);
		

	
	
	$.ajax({
		type: 'POST',
		url: '/rec',
		data: fd,
		processData: false,
		contentType: false
	}).done((data) => {
		$('#speechTranscriptContainer').attr("hidden", true);
		$('#recordedSpeechTranscript').attr("hidden", false);

		$('#spinnerTrans').attr('hidden', true);
		$('#recordedText').text(data);
		console.log(data);

		let tranScriptArray = data.split(" ");
		let fillerWordsCount = 0;

		tranScriptArray.forEach((item) => {
			if (item == "like" || item == "ahmm" || item == "umm" || item == "likelike") {
				fillerWordsCount++
			}
		});

		if (fillerWordsCount > 0) {
			$('#fillerWordsCount').text('Filler Words Count :' + fillerWordsCount);
		}

		$('#graphLoader').attr('hidden', false);
		getEnergyGraph()





	})
}

async function getEnergyGraph() {
	$.ajax({
		type: 'GET',
		url: '/energyGraph',

	}).done((data) => {

		$('#graphLoader').attr('hidden', true);

		$('#graphImage').attr('src', 'data:image/png;base64, ' + data);
		$('#graphContainer').attr('hidden', false);







	})

}