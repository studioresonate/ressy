const coachmark = document.querySelector('.coachmark')
const wrapper = document.querySelector('.wrapper')
const boulder = document.querySelector('.boulder');
const body = document.body;

const played = false;

(async () => {
    let volumeCallback = null;
    let volumeInterval = null;
    const volumeVisualizer = document.getElementById('volume-visualizer');
    const ressyMouth = document.querySelector('.ressy .mouth');
    const startButton = document.querySelector("button");

    // Initialize
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const audioContext = new (AudioContext || window.webkitAudioContext)();
      const audioSource = audioContext.createMediaStreamSource(audioStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.minDecibels = -100;
      analyser.maxDecibels = 0;
      analyser.smoothingTimeConstant = 0.2;
      audioSource.connect(analyser);
      const volumes = new Uint8Array(analyser.frequencyBinCount);
      volumeCallback = () => {
        analyser.getByteFrequencyData(volumes);
        let volumeSum = 0;
        for(const volume of volumes)
          volumeSum += volume;
        const averageVolume = volumeSum / volumes.length;
        // Value range: 100 = analyser.maxDecibels - analyser.minDecibels;
        volumeVisualizer.style.setProperty('--volume', (averageVolume * 2 / 100) + '%');
        console.log('Average volume:' + Math.round(averageVolume));

        // averageVolume of 0-6 is ambient noise
        if (averageVolume >= 7 && averageVolume <= 40) {
            ressyMouth.style.setProperty('--volume', Math.round(averageVolume) * 2 / 60);
        } else if (averageVolume >= 41) {
            console.log('TOO LOUD!!!!!!!!');
            ressyMouth.style.setProperty('--volume', Math.round(averageVolume) * 2 / 160);
            body.classList.add('bounce');
            setTimeout(() => {
                body.classList.remove('bounce');
            }, 500);
        } else {
            console.log('Idle');
        }
      };
    } catch(e) {
      console.error('Failed to initialize microphone', e);
      body.insertAdjacentHTML('afterbegin', `
          <div class="error">⚠️ Ruh roh!! Please allow microphone permissions.</div>
      `)

    }

    startButton.addEventListener('click', () => {
      // Updating every 100ms (should be same as CSS transition speed)
      if(volumeCallback !== null && volumeInterval === null)
        volumeInterval = setInterval(volumeCallback, 100);
    });

  })();



document.querySelector("button").addEventListener("click", function(e) {
    e.preventDefault();

    const reset = document.querySelector('.reset');

    // this.style.visibility = "hidden";
    coachmark.style.visibility = "hidden";
    wrapper.classList.add('start');

    // no ressy
    const keypattern = [
        "n", "o", "r", "e", "s", "s", "y"
    ];
    let index = 0;
    window.onkeydown = function(e) {
        const key = e.key;
        const audio = new Audio('../sound/fall.mp3');
        if (key === keypattern[index]) {
            index++;
            if (index === keypattern.length) {
                if (played === false) {
                    setTimeout(() => {
                      reset.setAttribute("style", "visibility:visible; opacity:1");
                    }, 1500);
                    boulder.setAttribute("style","visibility:visible;")
                    audio.play();
                }
                window.removeEventListener("onkeydown", this.keypattern);
                body.classList.add('splat');
                played = true;
                index = 0;
            }
        } else {
            // reset if incorrect
            index = 0;
        }
    }


    reset.addEventListener("click", function() {
        body.classList.remove('splat');
        boulder.setAttribute("style","visibility:hidden;")
        this.setAttribute("style", "visibility:hidden; opacity:0");
        index = 0;
        played = false;
    })
});


