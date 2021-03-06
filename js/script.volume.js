// console.clear;

var audioContext = null;
var meter = null;
var mediaStreamSource = null;
// var rafID = null;
var maxVolume = 500
var minVolume = 20;
var scaleFactor = maxVolume*5;
var vol = 0;
var wrapper = document.querySelector('.wrapper');
var coachmark = document.querySelector('.coachmark');
var body = document.querySelector('.body');
// set no ressy to false
var played = false;


function initAudioContext() {
    // monkeypatch Web Audio
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    // grab an audio context
    audioContext = new AudioContext();

    var constraints = { audio: true, video: false };

    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      gotStream(stream);
    })
    .catch(function(err) {
        console.log(err.name + ": " + err.message);
        document.body.insertAdjacentHTML('afterbegin', '<div class="error mic">⚠️ Houston, we have a problem! Please allow microphone access.</div>')
    }); // check for errors at the end.

}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);

    // Create a new volume meter and connect it.
    meter = createAudioMeter(audioContext);
    mediaStreamSource.connect(meter);

    // kick off the visual updating
    // gsap.ticker.addEventListener("tick", draw);
    gsap.ticker.add(draw);
}

function draw(time) {

    vol = meter.volume * scaleFactor;
    // max out volume
    if (vol > maxVolume) {
        vol = maxVolume;
        console.log('bounce');
        wrapper.classList.add('bounce');
        body.classList.add('bounce');
        setTimeout(() => {
            wrapper.classList.remove('bounce');
            body.classList.remove('bounce');
        }, 500);
    } else if (vol < minVolume) {
        vol = minVolume;
    }

    // gsap.to(":root", 1, { "--myWeight": vol, ease: Expo.easeOut });
    // gsap.to('.bg', 1, { opacity: meter.volume } );
    gsap.to('.mouth', 1, {scaleY: -vol/250, ease: Expo.easeOut } );
    gsap.to('.cloudMouth', 3, { scaleY: -vol/250, ease: Expo.easeOut } );
    gsap.to('.pedals1', 4, { rotation: vol/2, ease: Expo.easeOut } );
    gsap.to('.pedals2', 6, { rotation: -vol/1, ease: Expo.easeOut } );
    // gsap.to('.flower2', 2, { rotationX: vol, ease: Expo.easeOut } );
    // gsap.to('.flower3', 2, { filter:'hue-rotate(' + vol + 'deg)', ease: Expo.easeOut } );
    gsap.to('.flower1', 2, { skewX: vol/80, ease: Expo.easeOut } );
    gsap.to('.flower2', 4, { skewX: -vol/80, ease: Expo.easeOut } );
    gsap.to('.flowerMouth', 3, { scaleY: -vol/250, ease: Expo.easeOut } );
}



document.querySelector("button").addEventListener("click", function(e) {
    e.preventDefault();
    initAudioContext();

    // var boulder = document.querySelector('.boulder');
    var reset = document.querySelector('.reset');

    this.style.visibility = "hidden";
    coachmark.style.visibility = "hidden";
    wrapper.classList.add('start');

    // no ressy
    var keypattern = [
        "n", "o", "r", "e", "s", "s", "y"
    ];
    let index = 0;
    window.onkeydown = function(e) {
        var key = e.key;
        var audio = new Audio('../sound/fall.mp3');
        if (key === keypattern[index]) {
            index++;
            if (index === keypattern.length) {
                // boulder drop
                gsap.to('.boulder', 0.5, {bottom: "3rem",visibility:"visible" } );
                // ressy splat
                gsap.to('.ressy', 0.1, {scaleY: "0.01",opacity:"0" } ).delay(0.4);
                if (played === false) {
                    gsap.to('.reset', 0.5, {opacity:"1",visibility:"visible" } ).delay(1.5);
                    audio.play();
                }
                window.removeEventListener("onkeydown", this.keypattern);
                document.body.classList.add('splat');
                played = true;
                index = 0;
            }
        } else {
            // reset if incorrect
            index = 0;
        }
    }


    reset.addEventListener("click", function() {
        document.body.classList.remove('splat');
        gsap.to('.ressy', 0.1, {scaleY: "1",opacity:"1" } );
        gsap.to('.boulder', {bottom: "900rem", visibility:"hidden" } );
        gsap.to('.reset', {opacity: "0", visibility:"hidden" } );
        index = 0;
        played = false;
    })
});

/*
The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
Usage:
audioNode = createAudioMeter(audioContext,clipLevel,averaging,clipLag);
audioContext: the AudioContext you're using.
clipLevel: the level (0 to 1) that you would consider "clipping".
   Defaults to 0.98.
averaging: how "smoothed" you would like the meter to be over time.
   Should be between 0 and less than 1.  Defaults to 0.95.
clipLag: how long you would like the "clipping" indicator to show
   after clipping has occured, in milliseconds.  Defaults to 750ms.
Access the clipping through node.checkClipping(); use node.shutdown to get rid of it.
*/

function createAudioMeter(audioContext, clipLevel, averaging, clipLag) {
    var processor = audioContext.createScriptProcessor(512);
    processor.onaudioprocess = volumeAudioProcess;
    processor.clipping = false;
    processor.lastClip = 0;
    processor.volume = 0;
    processor.clipLevel = clipLevel || 0.98;
    processor.averaging = averaging || 0.95;
    processor.clipLag = clipLag || 750;

    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    processor.connect(audioContext.destination);

    processor.checkClipping = function() {
        if (!this.clipping) return false;
        if (this.lastClip + this.clipLag < window.performance.now())
            this.clipping = false;
        return this.clipping;
    };

    processor.shutdown = function() {
        this.disconnect();
        this.onaudioprocess = null;
    };

    return processor;
}

function volumeAudioProcess(event) {
    var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
    var sum = 0;
    var x;

    // Do a root-mean-square on the samples: sum up the squares...
    for (var i = 0; i < bufLength; i++) {
        x = buf[i];
        if (Math.abs(x) >= this.clipLevel) {
            this.clipping = true;
            this.lastClip = window.performance.now();
        }
        sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms = Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    // this.volume = Math.max(rms, this.volume*this.averaging);
    this.volume = rms; // without the slow release using gsap instead
}


gsap.to('.cloudWrapper', { duration: 30, repeat:-1, ease: "power1.inOut", yoyo:true, left:"70%" });


