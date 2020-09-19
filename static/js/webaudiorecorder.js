(function (n) {
    var e = function () {
        var i = arguments[0],
            t = [].slice.call(arguments, 1);
        for (var n = 0; n < t.length; ++n) {
            var r = t[n];
            for (key in r) {
                var o = r[key];
                i[key] = typeof o === "object" ? e(typeof i[key] === "object" ? i[key] : {}, o) : o
            }
        }
        return i
    };
    var o = {
        wav: "WebAudioRecorderWav.min.js",
        ogg: "WebAudioRecorderOgg.min.js",
        mp3: "WebAudioRecorderMp3.min.js"
    };
    var t = {
        workerDir: "/",
        numChannels: 2,
        encoding: "wav",
        options: {
            timeLimit: 300,
            encodeAfterRecord: false,
            progressInterval: 1e3,
            bufferSize: undefined,
            wav: {
                mimeType: "audio/wav"
            },
            ogg: {
                mimeType: "audio/ogg",
                quality: .5
            },
            mp3: {
                mimeType: "audio/mpeg",
                bitRate: 160
            }
        }
    };
    var i = function (i, n) {
        e(this, t, n || {});
        this.context = i.context;
        if (this.context.createScriptProcessor == null) this.context.createScriptProcessor = this.context.createJavaScriptNode;
        this.input = this.context.createGain();
        i.connect(this.input);
        this.buffer = [];
        this.initWorker()
    };
    e(i.prototype, {
        isRecording: function () {
            return this.processor != null
        },
        setEncoding: function (e) {
            if (this.isRecording()) this.error("setEncoding: cannot set encoding during recording");
            else if (this.encoding !== e) {
                this.encoding = e;
                this.initWorker()
            }
        },
        setOptions: function (i) {
            if (this.isRecording()) this.error("setOptions: cannot set options during recording");
            else {
                e(this.options, i);
                this.worker.postMessage({
                    command: "options",
                    options: this.options
                })
            }
        },
        startRecording: function () {
            if (this.isRecording()) this.error("startRecording: previous recording is running");
            else {
                var i = this.numChannels,
                    e = this.buffer,
                    n = this.worker;
                this.processor = this.context.createScriptProcessor(this.options.bufferSize, this.numChannels, this.numChannels);
                this.input.connect(this.processor);
                this.processor.connect(this.context.destination);
                this.processor.onaudioprocess = function (t) {
                    for (var o = 0; o < i; ++o) e[o] = t.inputBuffer.getChannelData(o);
                    n.postMessage({
                        command: "record",
                        buffer: e
                    })
                };
                this.worker.postMessage({
                    command: "start",
                    bufferSize: this.processor.bufferSize
                });
                this.startTime = Date.now()
            }
        },
        recordingTime: function () {
            return this.isRecording() ? (Date.now() - this.startTime) * .001 : null
        },
        cancelRecording: function () {
            if (this.isRecording()) {
                this.input.disconnect();
                this.processor.disconnect();
                delete this.processor;
                this.worker.postMessage({
                    command: "cancel"
                })
            } else this.error("cancelRecording: no recording is running")
        },
        finishRecording: function () {
            if (this.isRecording()) {
                this.input.disconnect();
                this.processor.disconnect();
                delete this.processor;
                this.worker.postMessage({
                    command: "finish"
                })
            } else this.error("finishRecording: no recording is running")
        },
        cancelEncoding: function () {
            if (this.options.encodeAfterRecord)
                if (this.isRecording()) this.error("cancelEncoding: recording is not finished");
                else {
                    this.onEncodingCanceled(this);
                    this.initWorker()
                }
            else this.error("cancelEncoding: invalid method call")
        },
        initWorker: function () {
            if (this.worker != null) this.worker.terminate();
            this.onEncoderLoading(this, this.encoding);
            this.worker = new Worker(this.workerDir + o[this.encoding]);
            var e = this;
            this.worker.onmessage = function (n) {
                var i = n.data;
                switch (i.command) {
                    case "loaded":
                        e.onEncoderLoaded(e, e.encoding);
                        break;
                    case "timeout":
                        e.onTimeout(e);
                        break;
                    case "progress":
                        e.onEncodingProgress(e, i.progress);
                        break;
                    case "complete":
                        e.onComplete(e, i.blob);
                        break;
                    case "error":
                        e.error(i.message)
                }
            };
            this.worker.postMessage({
                command: "init",
                config: {
                    sampleRate: this.context.sampleRate,
                    numChannels: this.numChannels
                },
                options: this.options
            })
        },
        error: function (e) {
            this.onError(this, "WebAudioRecorder.min.js:" + e)
        },
        onEncoderLoading: function (e, i) {},
        onEncoderLoaded: function (e, i) {},
        onTimeout: function (e) {
            e.finishRecording()
        },
        onEncodingProgress: function (e, i) {},
        onEncodingCanceled: function (e) {},
        onComplete: function (e, i) {
            e.onError(e, "WebAudioRecorder.min.js: You must override .onComplete event")
        },
        onError: function (i, e) {
            console.log(e)
        }
    });
    n.WebAudioRecorder = i
})(window);