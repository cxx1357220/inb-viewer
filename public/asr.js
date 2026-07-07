
const sherpa_onnx = require('sherpa-onnx');
const path = require('path')



function createRecognizer(senseVoiceModelPath, senseVoiceTokenPath, language = 'auto') {
    let modelConfig = {
        senseVoice: {
            model: senseVoiceModelPath,
            language: language,
            useInverseTextNormalization: 1,
        },
        tokens: senseVoiceTokenPath
    };

    let config = {
        modelConfig: modelConfig,
    };

    return sherpa_onnx.createOfflineRecognizer(config);
}

function createVad(sileroVadModelPath, threshold = 0.5, minSpeechDuration = 0.25, minSilenceDuration = 0.5, maxSpeechDuration = 5,) {
    // please download silero_vad.onnx from
    // https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/silero_vad.onnx
    const config = {
        sileroVad: {
            model: sileroVadModelPath,
            threshold,
            minSpeechDuration,
            minSilenceDuration,
            maxSpeechDuration,
            windowSize: 512,
        },
        // tenVad: {
        //     // model: './ten-vad.onnx',
        //     model: '',
        //     threshold: 0.5,
        //     minSpeechDuration: 0.25,
        //     minSilenceDuration: 0.5,
        //     maxSpeechDuration: 5,
        //     windowSize: 256,
        // },
        sampleRate: 16000,
        debug: true,
        numThreads: 1,
        bufferSizeInSeconds: 60,
    };

    return sherpa_onnx.createVad(config);
}





function asr(obj) {
    let outList = []
    let wavPath = obj.wavPath
    if (obj.sileroVadVersion == 'none') {
        const recognizer = createRecognizer(obj.senseVoiceModelPath, obj.senseVoiceTokenPath, obj.language);
        const stream = recognizer.createStream();

        const wave = sherpa_onnx.readWave(wavPath);
        stream.acceptWaveform(wave.sampleRate, wave.samples);

        recognizer.decode(stream);
        const text = recognizer.getResult(stream).text;
        console.log(text);
        process.send({
            percent: 'done',
            text
        });

        stream.free();
        recognizer.free();
        return
    }


    const recognizer = createRecognizer(obj.senseVoiceModelPath, obj.senseVoiceTokenPath, obj.language);

    let sileroVadModelPath = path.join(obj.sileroVadModelPath, obj.sileroVadVersion);
    const vad = createVad(sileroVadModelPath, obj.threshold, obj.minSpeechDuration, obj.minSilenceDuration, obj.maxSpeechDuration);

    const wave = sherpa_onnx.readWave(wavPath);

    if (wave.sampleRate != recognizer.config.featConfig.sampleRate) {
        process.send({
            percent: 'error',
        });
        console.log(`Expected sample rate: ${recognizer.config.featConfig.sampleRate}. Given: ${wave.sampleRate}`);
        return
        // throw new Error(
        //     'Expected sample rate: ${recognizer.config.featConfig.sampleRate}. Given: ${wave.sampleRate}');
    }

    console.log('Started');
    let start = Date.now();
    const duration = wave.samples.length / wave.sampleRate;
    const windowSize = vad.config.sileroVad.windowSize;
    for (let i = 0; i < wave.samples.length; i += windowSize) {
        const thisWindow = wave.samples.subarray(i, i + windowSize);
        vad.acceptWaveform(thisWindow);

        while (!vad.isEmpty()) {
            const segment = vad.front();
            vad.pop();

            let start_time = segment.start / wave.sampleRate;
            let end_time = start_time + segment.samples.length / wave.sampleRate;

            start_time = start_time.toFixed(2);
            end_time = end_time.toFixed(2);

            const stream = recognizer.createStream();
            stream.acceptWaveform(wave.sampleRate, segment.samples);

            recognizer.decode(stream);
            const r = recognizer.getResult(stream);
            if (r.text.length > 0) {
                const text = r.text.toLowerCase().trim();
                console.log(`${start_time} -- ${end_time}:: ${text}`);
                outList.push({
                    start_time,
                    end_time,
                    text
                })
                let t = (end_time / duration) * 100;
                process.send({
                    percent: (t / 2 + 50).toFixed(2)
                })
            }

            stream.free();
        }
    }

    vad.flush();

    while (!vad.isEmpty()) {
        const segment = vad.front();
        vad.pop();

        let start_time = segment.start / wave.sampleRate;
        let end_time = start_time + segment.samples.length / wave.sampleRate;

        start_time = start_time.toFixed(2);
        end_time = end_time.toFixed(2);

        const stream = recognizer.createStream();
        stream.acceptWaveform(wave.sampleRate, segment.samples);

        recognizer.decode(stream);
        const r = recognizer.getResult(stream);
        if (r.text.length > 0) {
            const text = r.text.toLowerCase().trim();
            console.log(`${start_time} -- ${end_time}: ${text}`);
            let t = (end_time / duration) * 100;
            outList.push({
                start_time,
                end_time,
                text
            })
            process.send({
                percent: (t / 2 + 50).toFixed(2)
            })
        }
    }

    let stop = Date.now();

    const elapsed_seconds = (stop - start) / 1000;
    const real_time_factor = elapsed_seconds / duration;
    console.log('Wave duration', duration.toFixed(3), 'seconds');
    console.log('Elapsed', elapsed_seconds.toFixed(3), 'seconds');
    console.log(
        `RTF = ${elapsed_seconds.toFixed(3)}/${duration.toFixed(3)} =`,
        real_time_factor.toFixed(3));

    vad.free();
    recognizer.free();

    console.log('Done');
    process.send({
        percent: 'done',
        outList
    })



}






process.on('message', function (pathObj) {
    console.log('pathObj: ', pathObj);
    asr(pathObj)


})