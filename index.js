document.addEventListener('DOMContentLoaded', () => {
 
    const jsAudios = document.querySelectorAll('.js-audio');
   
    jsAudios.forEach((audio) => {
      createAudioPlayer(audio);
    });

    function createAudioPlayer(audio, bgc, color, vol = 1.0) {
   
      if (!audio || audio.tagName !== 'AUDIO') {
        return;
      }
      const audioPlayer = document.createElement('div');
      audioPlayer.className = 'audio-player';
      audio.parentNode.insertBefore(audioPlayer, audio);
      audioPlayer.appendChild(audio);
   
      // コントロール部分の HTML
      const controls = `<div class="controls">
      <button class="toggle play-btn" type="button" aria-label="Play"></button>
      <div class="time" role="timer">
        <span class="current-time">0:00</span>
      </div>
      <input class="range-slider" type="range" name="seek" value="0" step=".1" aria-label="seek bar">
      <div class="time" role="timer">
        <span class="duration">0:00</span>
      </div>
      <input class="range-slider" type="range" name="vol" min="0.0" max="1.0" value="1.0" step=".1" aria-label="volume bar">
    </div>`;
   
      audioPlayer.insertAdjacentHTML('afterbegin', controls);
      audio.controls = false;
      audio.volume = vol;
      audio.preload = 'metadata';

      const toggleBtn = audioPlayer.querySelector('.toggle');
      const ctSpan = audioPlayer.querySelector('.time .current-time');
      ctSpan.textContent = secToHMS(audio.currentTime);
      const durSpan = audioPlayer.querySelector('.time .duration');

      audio.loop = false;

      const volumeBar = audioPlayer.querySelector('input[name="vol"]');
      volumeBar.value = audio.volume;
      volumeBar.addEventListener('input', (e) => {
        // スライダーの値に現在の値を設定
        audio.volume = e.currentTarget.value;
      });

      audio.muted = false;
      if (!audio.muted) {
        audio.muted = false;
        volumeBar.value = audio.volume;
        updateSlider(volumeBar, bgc, color);
      }
   
      audio.addEventListener('volumechange', (e) => {
        if (e.currentTarget.muted) {
          volumeBar.value = 0;
        } else {
          volumeBar.value = audio.volume;
        }
        updateSlider(volumeBar, bgc, color);
      }, false);
   
      const seekBar = audioPlayer.querySelector('input[name="seek"]');
      seekBar.addEventListener('input', (e) => {
        audio.currentTime = e.currentTarget.value;
      });
   
      let duration;
      audio.addEventListener('loadedmetadata', () => {
        duration = audio.duration;
        durSpan.textContent = secToHMS(Math.floor(duration));
        seekBar.setAttribute('max', Math.floor(duration));
      });
   
      // currentTime プロパティの値が更新される際のリスナーの登録
      audio.addEventListener('timeupdate', updateTime, false);
      function updateTime() {
        const cTime = audio.currentTime;
        ctSpan.textContent = secToHMS(Math.floor(cTime));
        seekBar.value = cTime;
        updateSlider(seekBar, bgc, color);
      }
   
      toggleBtn.addEventListener('click', togglePlayPause, false);
      function togglePlayPause() {
        if (audio.paused) {
          playAudio();
        } else {
          audio.pause();
        }
      }
   
      async function playAudio() {
        try {
          await audio.play();
          toggleBtn.classList.add('playing');
          toggleBtn.setAttribute('aria-label', 'Pause');
        } catch (err) {
          toggleBtn.classList.remove('playing');
          console.warn(err)
        }
      }
   
      audio.addEventListener('pause', () => {
        toggleBtn.classList.remove('playing');
        toggleBtn.setAttribute('aria-label', 'Play');
      });
   
      audio.addEventListener('play', (e) => {
        toggleBtn.classList.add('playing');
        toggleBtn.setAttribute('aria-label', 'Pause');
      });
   
      audio.addEventListener('ended', audioEnded, false);
      function audioEnded() {
        toggleBtn.classList.remove('playing');
        toggleBtn.setAttribute('aria-label', 'Play');
      }
   
      // ボリュームと再生位置のレンジスライダー（レンジ入力欄の背景色を設定）を取得
      const rangeSliders = audioPlayer.querySelectorAll('.range-slider');
      // レンジスライダーの input イベントに別途定義した関数 updateSlider を設定
      rangeSliders.forEach((slider) => {
        slider.addEventListener('input', (e) => {
          // 背景色を更新
          updateSlider(e.target, bgc, color);
        });
        // 初期状態に現在の状態での背景色を反映
        updateSlider(slider, bgc, color);
      });
    };
   
    /**
     * 秒数を引数に受け取り hh:mm:ss に変換する関数
     * @param {Number}  seconds 秒数
     */
    function secToHMS(seconds) {
      const hour = Math.floor(seconds / 3600);
      const min = Math.floor(seconds % 3600 / 60);
      const sec = seconds % 60;
      let hh;
      if (hour < 100) {
        hh = (`00${hour}`).slice(-2);
      } else {
        hh = hour;
      }
      const mm = (`00${min}`).slice(-2);
      const ss = (`00${sec}`).slice(-2);
      let time = '';
      if (hour !== 0) {
        time = `${hh}:${mm}:${ss}`;
      } else {
        time = `${mm}:${ss}`;
      }
      return time;
    }
   
    /**
    * レンジスライダーのトラックの塗りの範囲と色を更新する関数
    * @param {HTMLElement}  slider レンジスライダー（input type="range"）
    * @param {String}  bgc ベースとなるトラックの背景色（デフォルト #ccc）
    * @param {String}  color 変化する領域（ツマミの左側）の背景色（デフォルト #8ea8f9）
    */
    function updateSlider(slider, bgc = '#ccc', color = '#8ea8f9') {
      if (!slider.max) {
        slider.max = 100;
      }
      const progress = (slider.value / slider.max) * 100;
      slider.style.background = `linear-gradient(to right, ${color} ${progress}%, ${bgc} ${progress}%)`;
    }
   
    /**
    * プレーヤーが開始されると、他のプレーヤーを一時停止させる関数
    * @param {String}  selector audio 要素の CSS セレクタ名（デフォルト audio 要素）
    */
    function pauseOtherAudioPlayers(selector = 'audio') {
      // ドキュメントの play イベント
      document.addEventListener('play', (e) => {
        // 全ての selector で指定された要素を取得
        const audios = document.querySelectorAll(selector);
        // それぞれの audio 要素で以下を実行
        audios.forEach((audio) => {
          // audio が存在しない場合やそれが audio 要素でなければ終了（audio 要素とは限らない）
          if (!audio || audio.tagName !== 'AUDIO') {
            return;
          }
          // play イベントが発生した要素が自身でなければ停止
          if (audio !== e.target) {
            audio.pause();
          }
        });
      }, true);
    }
   
    //プレーヤーを開始すると、他のプレーヤーを一時停止（不要であれば以下をコメントアウトまたは削除）
    pauseOtherAudioPlayers()
  });