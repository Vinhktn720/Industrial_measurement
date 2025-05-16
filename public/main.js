// =================================================== CONST & VARS =================================================== //

const ssName = ["", "Potentiometer", "Load cell", "Thermistor"],
      ssPre  = ["", " %", " kg", " °C"];

var id, cnt = 0, sensorChart = [];

// ================================================= SPACE BACKGROUND ================================================= //

// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 800;

// Set up renderer as background
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
Object.assign(renderer.domElement.style, {position: 'fixed', top: 0, left: 0, zIndex: '-1', pointerEvents: 'none'});

// Generate starfield
const starCnt = 10000;
const starPos = new Float32Array(starCnt * 3).map(() => (Math.random() - 0.5) * 2000);
const starGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starAtt = new THREE.PointsMaterial({ color: 0xffffff, size: 1, transparent: true });
const stars = new THREE.Points(starGeo, starAtt);
scene.add(stars);

// Animate
function animateStars() {
    requestAnimationFrame(animateStars);
    stars.rotation.y += 0.0005;
    stars.rotation.x += 0.0003;

    const pos = stars.geometry.attributes.position.array;
    for (let i = 1; i < pos.length; i += 3) {
        pos[i] = pos[i] < -1000 ? 1000 : pos[i] - 0.05;
    }
    stars.geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}

// Responsive
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animateStars();

// ===================================================== LISTENER ===================================================== //

// Mode buttons
document.querySelectorAll('.sect > *').forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelectorAll('.sel').forEach(e => e.classList.remove('sel'));
    btn.classList.add("sel");
    setTimeout(() => document.querySelector(`.${btn.classList[0].replace('Btn', '')}`).classList.add("sel"), 300);
  })
);

// Sensor selection for Calibration
document.querySelectorAll(".page").forEach((e, i) => {
  e.addEventListener("click", () => {
    document.querySelectorAll('.page').forEach((e, j) => e.classList.toggle('active' , j == i));
    swiper.slideTo(i);
    document.getElementById("sensorNameInput").value = document.getElementById(`sensorName${i + 1}`).textContent;
  });
});

// ====================================================== UPDATE ====================================================== //

setInterval(() => {
  cnt++;
  const scnt = `${String(Math.floor(cnt / 60)).padStart(2, '0')}:${String(cnt % 60).padStart(2, '0')}`,
  now = new Date(),
  opt = {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'};
  for(let i = 0; i < 3; i++) {
    let val  = +document.getElementById(`sensorValue${i + 1}`).textContent.split(' ')[0];
    updateChr(sensorChart[i], cnt, val);
    document.querySelectorAll('.page')[i].classList.toggle('active' , i == swiper.activeIndex);
    document.querySelectorAll('.cardDate p')[i].textContent = now.toLocaleDateString('en-GB', opt);
    document.querySelectorAll('.cardTime p')[i].textContent = now.toLocaleTimeString('en-GB', {hour12: false});
    document.querySelectorAll('.cardCnt  p')[i].textContent = scnt;
    const log = document.querySelectorAll('.cardLog')[i].querySelector('div');
    log.innerHTML = `<p><span>${scnt}</span><span>${val}${ssPre[i + 1]}</span></p>` + log.innerHTML;

  }
}, 1000);

// ===================================================== DISPLAY  ===================================================== //

// Create UI for sensors dynamically
const sensorContainer = document.getElementById("sensorContainer");
const sensors = {};
for (let i = 1; i <= 3; i++) {
  const card = document.createElement("div");
  card.className = "sensorCard swiper-slide";
  card.innerHTML = `
      <div class = "cardName"> Name:   <p id="sensorName${i}"></p></div>
      <div class = "cardVal">  Value:  <p id = "sensorValue${i}">NaN ${ssPre[i]}</p></div>
      <div class = "cardId">   ID:     <p>#${i}</p></div>
      <div class = "cardZero"> Zero:   <p id = "oldCalibZero${i}">NaN</p></div>
      <div class = "cardSpan"> Span:   <p id = "oldCalibSpan${i}">NaN</p></div>
      <div class = "cardGraph">Graph:  <canvas class = "chart"></canvas></div>
      <div class = "cardDate"> Date:   <p></p></div>
      <div class = "cardTime"> Time:   <p></p></div>
      <div class = "cardCnt">  Counter:<p></p></div>
      <div class = "cardLog">  Logs:   <div></div></div>`;
  sensorContainer.appendChild(card);
  sensors[i] = card;
}

for(let i = 0; i < 3; i++) {
  let ctx = document.querySelectorAll('.chart')[i].getContext('2d'),
      data = {datasets: [{data: [], borderColor: '#333', backgroundColor: '#333'}]},
      config = {
        type: 'line',
        data: data,
        options: {
          interaction: { mode: 'nearest', intersect: false },
          scales: {
              x: { type: 'linear', title: { display: true, text: 'Time (seconds)' } },
              y: { title: { display: true, text: 'Value' } }
          },
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#d5d0ce', borderWidth: 1, borderColor: '#333', titleColor: '#333', bodyColor: '#333',
              callbacks: {
                  title: t => 'Value: ' + t[0].raw + ssPre[i + 1],
                  label: t => 'Time: ' + t.label + 's'
              }
            }
          }
        }
      };
  const chart = new Chart(ctx, config);
  sensorChart[i] = {chart, data};
}

function updateChr(chr, time, val) {
  chr.data.labels.push(time);
  chr.data.datasets[0].data.push(val);
  chr.chart.update();
}

var swiper = new Swiper(".slider", {
  slidesPerView: 1,
  spaceBetween: 100,
  loop: true,
  keyboard: {enabled: true},
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
    renderBullet: function (index, className) {
      return '<span class="' + className + '">' + (index + 1) + "</span>";
    },
  },
  navigation: {nextEl: ".nextBtn", prevEl: ".prevBtn"},
  on: {
    activeIndexChange: function () {
      console.log('Active index changed to:', this.activeIndex);
    },
    slideChange: function () {
      console.log('Slide changed. Current slide index:', this.activeIndex);
    }
  }
});

// =============================================== MODBUS COMMUNICATION =============================================== //

const socket = io();
 // Listen for incoming sensor data
 socket.on("modbusData", (data) => {
  if (data.sensors && Array.isArray(data.sensors)) {
    data.sensors.forEach((sensor) => {
      const { id, sensorValue, calibZero, calibSpand, name } = sensor;
      if (sensors[id]) {
        document.getElementById(`sensorValue${id}`).innerText = sensorValue + ssPre[ssName.indexOf(name)];
        document.getElementById(`oldCalibZero${id}`).innerText = calibZero;
        document.getElementById(`oldCalibSpan${id}`).innerText = calibSpand;
        document.getElementById(`sensorName${id}`).innerText = name;
      }
    });
  }
});

// Handle calibration form submission
document.getElementById('submitBtn').addEventListener('click', function () {
  const sensorId   = swiper.activeIndex + 1;
  const calibZero  = Number(document.getElementById("calibZero").value);
  const calibSpand = Number(document.getElementById("calibSpan").value);
  const name = document.getElementById("sensorNameInput").value;
  socket.emit("calibrationData", { sensorId, calibZero, calibSpand, name });
});

// Handle interrupt button
document.getElementById("interruptBtn").addEventListener("click", () => {
  socket.emit("triggerInterrupt");
});
