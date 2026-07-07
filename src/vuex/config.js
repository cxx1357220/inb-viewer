const config = {
    compressSizeList: [{
        value: '1920*1080'
    }, {
        value: '1080*720'
    }],
    compressFpsList: [{
        value: '30'
    }, {
        value: '25'
    }],
    compressVcodecList: [{
        //   value: 'copy'
        // }, {
        value: 'libx264'
    }, {
        value: 'libx265'
    }],
    compressTypeList: [{
        value: '.mp4'
    }, {
        value: '.avi'
    }, {
        value: '.ts'
    }, {
        value: '.flv'
    }],
    // cpp 模型下载地址
    // downModelMap: {
    //     'ggml-small.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    //     'ggml-medium.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    //     'ggml-large.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large.bin',
    //     'ggml-tiny.bin': 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin'
    // },
    downModelMap: {
        'medium': [
            'https://hf-mirror.com/Systran/faster-whisper-medium/resolve/main/config.json',
            'https://hf-mirror.com/Systran/faster-whisper-medium/resolve/main/tokenizer.json',
            'https://hf-mirror.com/Systran/faster-whisper-medium/resolve/main/vocabulary.txt',
            'https://hf-mirror.com/Systran/faster-whisper-medium/resolve/main/model.bin',
        ],
        'small': [
            'https://hf-mirror.com/Systran/faster-whisper-small/resolve/main/config.json',
            'https://hf-mirror.com/Systran/faster-whisper-small/resolve/main/tokenizer.json',
            'https://hf-mirror.com/Systran/faster-whisper-small/resolve/main/vocabulary.txt',
            'https://hf-mirror.com/Systran/faster-whisper-small/resolve/main/model.bin',
        ],
        'base': [
            'https://hf-mirror.com/Systran/faster-whisper-base/resolve/main/config.json',
            'https://hf-mirror.com/Systran/faster-whisper-base/resolve/main/tokenizer.json',
            'https://hf-mirror.com/Systran/faster-whisper-base/resolve/main/vocabulary.txt',
            'https://hf-mirror.com/Systran/faster-whisper-base/resolve/main/model.bin',
        ],
        'tiny': [
            'https://hf-mirror.com/Systran/faster-whisper-tiny/resolve/main/config.json',
            'https://hf-mirror.com/Systran/faster-whisper-tiny/resolve/main/tokenizer.json',
            'https://hf-mirror.com/Systran/faster-whisper-tiny/resolve/main/vocabulary.txt',
            'https://hf-mirror.com/Systran/faster-whisper-tiny/resolve/main/model.bin',
        ]
    },
    whisperOutTypeList: [{
        //     label: '-ocsv',
        //     name: 'csv'
        // },{
        label: '-ovtt',
        name: 'vtt'
    }, {
        label: '-osrt',
        name: 'srt'
    }, {
        label: '-otxt',
        name: 'txt'
        // },{
        //     label: '-owts',
        //     name: 'words'
    }],
    languageList: [{
        "label": "Arabic",
        "value": "ar"
    },
    {
        "label": "Armenian",
        "value": "hy"
    },
    {
        "label": "Azerbaijani",
        "value": "az"
    },
    {
        "label": "Basque",
        "value": "eu"
    },
    {
        "label": "Belarusian",
        "value": "be"
    },
    {
        "label": "Bengali",
        "value": "bn"
    },
    {
        "label": "Bulgarian",
        "value": "bg"
    },
    {
        "label": "Catalan",
        "value": "ca"
    },
    {
        "label": "Chinese",
        "value": "zh"
    },
    {
        "label": "Croatian",
        "value": "hr"
    },
    {
        "label": "Czech",
        "value": "cs"
    },
    {
        "label": "Danish",
        "value": "da"
    },
    {
        "label": "Dutch",
        "value": "nl"
    },
    {
        "label": "English",
        "value": "en"
    },
    {
        "label": "Estonian",
        "value": "et"
    },
    {
        "label": "Filipino",
        "value": "tl"
    },
    {
        "label": "Finnish",
        "value": "fi"
    },
    {
        "label": "French",
        "value": "fr"
    },
    {
        "label": "Galician",
        "value": "gl"
    },
    {
        "label": "Georgian",
        "value": "ka"
    },
    {
        "label": "German",
        "value": "de"
    },
    {
        "label": "Greek",
        "value": "el"
    },
    {
        "label": "Gujarati",
        "value": "gu"
    },
    {
        "label": "Hebrew",
        "value": "iw"
    },
    {
        "label": "Hindi",
        "value": "hi"
    },
    {
        "label": "Hungarian",
        "value": "hu"
    },
    {
        "label": "Icelandic",
        "value": "is"
    },
    {
        "label": "Indonesian",
        "value": "id"
    },
    {
        "label": "Irish",
        "value": "ga"
    },
    {
        "label": "Italian",
        "value": "it"
    },
    {
        "label": "Japanese",
        "value": "ja"
    },
    {
        "label": "Kannada",
        "value": "kn"
    },
    {
        "label": "Korean",
        "value": "ko"
    },
    {
        "label": "Latin",
        "value": "la"
    },
    {
        "label": "Latvian",
        "value": "lv"
    },
    {
        "label": "Lithuanian",
        "value": "lt"
    },
    {
        "label": "Macedonian",
        "value": "mk"
    },
    {
        "label": "Malay",
        "value": "ms"
    },
    {
        "label": "Maltese",
        "value": "mt"
    },
    {
        "label": "Norwegian",
        "value": "no"
    },
    {
        "label": "Persian",
        "value": "fa"
    },
    {
        "label": "Polish",
        "value": "pl"
    },
    {
        "label": "Portuguese",
        "value": "pt"
    },
    {
        "label": "Romanian",
        "value": "ro"
    },
    {
        "label": "Russian",
        "value": "ru"
    },
    {
        "label": "Serbian",
        "value": "sr"
    },
    {
        "label": "Slovak",
        "value": "sk"
    },
    {
        "label": "Slovenian",
        "value": "sl"
    },
    {
        "label": "Spanish",
        "value": "es"
    },
    {
        "label": "Swahili",
        "value": "sw"
    },
    {
        "label": "Swedish",
        "value": "sv"
    },
    {
        "label": "Tamil",
        "value": "ta"
    },
    {
        "label": "Telugu",
        "value": "te"
    },
    {
        "label": "Thai",
        "value": "th"
    },
    {
        "label": "Turkish",
        "value": "tr"
    },
    {
        "label": "Ukrainian",
        "value": "uk"
    },
    {
        "label": "Urdu",
        "value": "ur"
    },
    {
        "label": "Vietnamese",
        "value": "vi"
    },
    {
        "label": "Welsh",
        "value": "cy"
    },
    {
        "label": "Yiddish",
        "value": "yi"
    }
    ],
    senseVoiceLanguageList: [{
        "label": "auto",
        "value": ""
    },
    {
        "label": "Chinese",
        "value": "zh"
    },
    {
        "label": "English",
        "value": "en"
    },
    {
        "label": "Japanese",
        "value": "ja"
    },
    {
        "label": "Korean",
        "value": "ko"
    }
    ],
    sileroVadVersionList: [
        {
            label: 'v4',
            value: 'silero_vad.onnx'
        },
        {
            label: 'v5',
            value: 'silero_vad_v5.onnx'
        },
        {
            label: 'none',
            value: 'none'
        }
    ],
}
module.exports = config