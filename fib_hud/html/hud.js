const CONFIG = {
  jobClasses: {
    'police': 'job-police',
    'ambulance': 'job-ambulance',
    'mechanic': 'job-mechanic',
    'taxi': 'job-taxi',
    'unemployed': 'job-unemployed'
  },
  colors: {
    rpm: {
      normal: "#22c55e",
      warning: "#f59e0b",
      danger: "#ef4444"
    },
    fuel: {
      normal: "#10b981",
      warning: "#f59e0b",
      danger: "#ef4444"
    },
    voice: {
      low: "bg-green-500",
      medium: "bg-orange-400",
      high: "bg-red-500"
    }
  },
  keys: {
    seatbelt: 71 // G
  }
};

const DOM = {
  elements: {},
  get: function(id) {
    if (!this.elements[id]) {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`Element with ID "${id}" not found!`);
        return null;
      }
      this.elements[id] = element;
    }
    return this.elements[id];
  },
  getAll: function(...ids) {
    return ids.reduce((obj, id) => {
      obj[id] = this.get(id);
      return obj;
    }, {});
  }
};

const Helpers = {
  formatCash: function(value) {
    const cashValue = typeof value === "number" && isFinite(value) ? value : 0;
    return `$${cashValue.toLocaleString()}`;
  },
 
  clamp: function(value, min, max) {
    return Math.max(min, Math.min(value, max));
  },
 
  updateBar: function(elementId, percent, colorMap = null) {
    const bar = DOM.get(elementId);
    if (!bar) return false;
   
    percent = this.clamp(percent, 0, 100);
    bar.style.width = `${percent}%`;
   
    if (colorMap) {
      let color;
      if (percent < 15) color = colorMap.danger;
      else if (percent < 30) color = colorMap.warning;
      else color = colorMap.normal;
      bar.style.backgroundColor = color;
    }
   
    return true;
  },
 
  updateIcon: function(iconId, isActive, activeIcon, inactiveIcon) {
    const icon = DOM.get(iconId);
    if (!icon) return;
   
    icon.src = isActive ? activeIcon : inactiveIcon;
    icon.classList.toggle("opacity-100", isActive);
    icon.classList.toggle("opacity-60", !isActive);
  }
};

const UI = {
  // Sounds
  seatbeltWarningSound: null,
  seatbeltOnSound: null,
  seatbeltOffSound: null,
  isSeatbeltWarningPlaying: false,
  inVehicle: false,
  isSeatbeltOn: false,
  lastRPM: 0,
  targetRPM: 0,
 
  init: function() {
    const cashElement = DOM.get("cash");
    if (cashElement) cashElement.innerText = "$0";
   
    const playerIdElement = DOM.get("player-id");
    const playerJobElement = DOM.get("player-job");
   
    if (playerIdElement) playerIdElement.innerText = "ID: 0";
    if (playerJobElement) playerJobElement.innerText = "Arbeitslos";
   
    const healthFill = DOM.get('health-fill');
    const armorFill = DOM.get('armor-fill');
    const foodFill = DOM.get('food-fill');
    const waterFill = DOM.get('water-fill');
   
    if (healthFill) healthFill.style.width = "100%";
    if (armorFill) armorFill.style.width = "0%";
    if (foodFill) foodFill.style.width = "100%";
    if (waterFill) waterFill.style.width = "100%";
   
    this.initSounds();
   
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
   
    this.startRPMAnimation();
   
    fetch(`https://${GetParentResourceName()}/nuiReady`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    }).then(() => {
      console.log("NUI ready");
    }).catch(error => {
      console.error("Error in nuiReady:", error);
    });
  },
 
  initSounds: function() {
    this.seatbeltWarningSound = new Audio('sounds/seatbelt_warning.ogg');
    this.seatbeltWarningSound.loop = true;
    this.seatbeltWarningSound.volume = 0.5;
    this.seatbeltOnSound = new Audio('sounds/buckle.ogg');
    this.seatbeltOnSound.volume = 0.5;
    this.seatbeltOffSound = new Audio('sounds/unbuckle.ogg');
    this.seatbeltOffSound.volume = 0.5;
  },
 
  handleKeyPress: function(event) {
    if (event.keyCode === CONFIG.keys.seatbelt && this.inVehicle) {
      this.toggleSeatbelt();
    }
  },
 
toggleSeatbelt: function() {
  this.isSeatbeltOn = !this.isSeatbeltOn;
  this.updateSeatbeltUI(this.isSeatbeltOn);
  
  if (this.isSeatbeltOn) {
    this.seatbeltOnSound.currentTime = 0;
    this.seatbeltOnSound.play().catch(e => console.error("Error playing buckle sound:", e));
    this.playSeatbeltWarning(false);
  } else {
    this.seatbeltOffSound.currentTime = 0;
    this.seatbeltOffSound.play().catch(e => console.error("Error playing unbuckle sound:", e));
  }
  
  fetch(`https://${GetParentResourceName()}/toggleSeatbelt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isBuckled: this.isSeatbeltOn })
  }).catch(error => {
    console.error("Error sending seatbelt status:", error);
  });
},

  updateSeatbeltUI: function(isBuckled) {
    const seatbeltIcon = DOM.get("icon-seatbelt");
    if (!seatbeltIcon) return;
   
    seatbeltIcon.src = isBuckled ? "icons/seatbelton.png" : "icons/seatbeltoff.png";
    seatbeltIcon.classList.toggle("opacity-60", !isBuckled);
    seatbeltIcon.classList.toggle("opacity-100", isBuckled);
   
    if (isBuckled) {
      seatbeltIcon.classList.remove("animate-pulse");
    }
  },
 
  playSeatbeltWarning: function(play) {
    if (play && !this.isSeatbeltWarningPlaying && !this.isSeatbeltOn) {
      this.seatbeltWarningSound.play().catch(e => console.error("Error playing warning sound:", e));
      this.isSeatbeltWarningPlaying = true;
    } else if (!play && this.isSeatbeltWarningPlaying) {
      this.seatbeltWarningSound.pause();
      this.seatbeltWarningSound.currentTime = 0;
      this.isSeatbeltWarningPlaying = false;
    }
  },
 
  updatePlayerId: function(id) {
    const playerIdElement = DOM.get("player-id");
    if (playerIdElement) playerIdElement.innerText = `ID: ${id}`;
  },
 
  updateJob: function(job) {
    const jobElement = DOM.get("player-job");
    if (!jobElement) return;
   
    let jobText = job.label || job;
    if (job.grade_label) {
      jobText += ` - ${job.grade_label}`;
    }
    jobElement.innerText = jobText;

    Object.values(CONFIG.jobClasses).forEach(cls => {
      jobElement.classList.remove(cls);
    });
   
    const jobName = job.name || job;
    const jobClass = CONFIG.jobClasses[jobName.toLowerCase()];
    if (jobClass) {
      jobElement.classList.add(jobClass);
    }
  },
 
  startRPMAnimation: function() {
    const animate = () => {
      this.updateRPMBar();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  },
 
  setTargetRPM: function(rpmValue) {
    this.targetRPM = Math.min(100, Math.round(rpmValue * 100));
  },
 
  updateRPMBar: function() {
    const rpmBar = DOM.get("rpm-bar");
    if (!rpmBar) return;
    const currentWidth = parseFloat(rpmBar.style.width || "0");
    const diff = this.targetRPM - currentWidth;
    const easingFactor = 0.15;
    const newWidth = currentWidth + (diff * easingFactor);
    rpmBar.style.width = `${newWidth}%`;
    let color;
    if (newWidth > 80) color = CONFIG.colors.rpm.danger;
    else if (newWidth > 60) color = CONFIG.colors.rpm.warning;
    else color = CONFIG.colors.rpm.normal;
    rpmBar.style.backgroundColor = color;
  },
 
  updateSpeedometer: function(data) {
    const speedometer = DOM.get("speedometer");
    if (!speedometer) return;
   
    if (data.showSpeedo !== undefined) {
      this.inVehicle = data.showSpeedo;
      speedometer.style.display = data.showSpeedo ? "block" : "none";
       
      if (!data.showSpeedo) {
        const speedText = DOM.get("speed-text");
        if (speedText) speedText.innerText = "0 km/h";

        this.targetRPM = 0;
           
        const gears = document.querySelectorAll("#gear-display .gear");
        gears.forEach(span => span.classList.remove("active"));
           
        Helpers.updateBar("fuel-fill", 0, CONFIG.colors.fuel);
        this.isSeatbeltOn = false;
        this.updateSeatbeltUI(false);
           
        const engineIcon = DOM.get("icon-engine");
        if (engineIcon) {
          engineIcon.src = "icons/engineon.png";
          engineIcon.classList.add("opacity-60");
        }
        this.playSeatbeltWarning(false);
      }
    }
   
    if (data.speed !== undefined) {
      const speedText = DOM.get("speed-text");
      if (speedText) speedText.innerText = `${Math.round(data.speed)} km/h`;
      if (data.speed > 20 && !this.isSeatbeltOn && this.inVehicle) {
        this.playSeatbeltWarning(true);
        const seatbeltIcon = DOM.get("icon-seatbelt");
        if (seatbeltIcon) seatbeltIcon.classList.add("animate-pulse");
      } else if (data.speed <= 20 || this.isSeatbeltOn) {
        this.playSeatbeltWarning(false);
        const seatbeltIcon = DOM.get("icon-seatbelt");
        if (seatbeltIcon) seatbeltIcon.classList.remove("animate-pulse");
      }
    }
   
    if (data.rpm !== undefined) {
      this.setTargetRPM(data.rpm);
    }
   
    if (data.gear !== undefined) {
      const allGears = document.querySelectorAll("#gear-display .gear");
      allGears.forEach(span => {
        span.classList.toggle("active", span.dataset.gear === data.gear.toString());
      });
    }
   
    if (data.fuel !== undefined) {
      Helpers.updateBar("fuel-fill", Math.round(data.fuel), CONFIG.colors.fuel);
    }
  },
 
  updateSeatbelt: function(isBuckled, showWarning) {
    const seatbeltIcon = DOM.get("icon-seatbelt");
    if (!seatbeltIcon) return;
   
    if (isBuckled !== undefined) {
      this.isSeatbeltOn = isBuckled;
      this.updateSeatbeltUI(isBuckled);
    }
   
    if (showWarning !== undefined) {
      seatbeltIcon.classList.toggle("animate-pulse", showWarning && !this.isSeatbeltOn);
      this.playSeatbeltWarning(showWarning && !this.isSeatbeltOn);
    }
  },
 
  updateEngine: function(engineHealth) {
    const engineIcon = DOM.get("icon-engine");
    if (!engineIcon) return;
   
    const warning = engineHealth < 400;
    engineIcon.src = warning ? "icons/engineoff.png" : "icons/engineon.png";
    engineIcon.classList.toggle("opacity-60", !warning);
    engineIcon.classList.toggle("opacity-100", warning);
  },
 
  updateCash: function(cash) {
    const cashElement = DOM.get("cash");
    if (!cashElement) return;
   
    try {
      cashElement.innerText = Helpers.formatCash(cash);
    } catch (error) {
      console.error("Fehler bei der Verarbeitung des Cash-Werts:", error);
      cashElement.innerText = "$0";
    }
  },
 
updateVoiceRange: function(voiceRange) {
  const dots = [
    DOM.get("voice-dot-1"),
    DOM.get("voice-dot-2"),
    DOM.get("voice-dot-3")
  ];
   
  if (!dots[0] || !dots[1] || !dots[2]) return;

  dots.forEach(dot => {
    dot.className = "h-3 w-3 rounded-full opacity-50";
    dot.style.backgroundColor = "#9ca3af";
  });
   
  if (voiceRange === "whisper") {
    dots[0].className = "h-3 w-3 rounded-full opacity-100";
    dots[0].style.backgroundColor = "#22c55e";

  } else if (voiceRange === "normal") {
    dots[0].className = "h-3 w-3 rounded-full opacity-100";
    dots[0].style.backgroundColor = "#22c55e";
    dots[1].className = "h-3 w-3 rounded-full opacity-100";
    dots[1].style.backgroundColor = "#fb923c";

  } else if (voiceRange === "shout") {
    dots[0].className = "h-3 w-3 rounded-full opacity-100";
    dots[0].style.backgroundColor = "#22c55e"
    
    dots[1].className = "h-3 w-3 rounded-full opacity-100";
    dots[1].style.backgroundColor = "#fb923c";
    dots[2].className = "h-3 w-3 rounded-full opacity-100";
    dots[2].style.backgroundColor = "#ef4444";
  }
},
 
  updateHealthArmor: function(health, armor) {
    if (health !== undefined) {
      const healthFill = DOM.get("health-fill");
      if (healthFill) healthFill.style.width = `${Helpers.clamp(health, 0, 100)}%`;
    }
   
    if (armor !== undefined) {
      const armorFill = DOM.get("armor-fill");
      if (armorFill) armorFill.style.width = `${Helpers.clamp(armor, 0, 100)}%`;
    }
  },
 
  updateNeeds: function(food, water) {
    if (food !== undefined) {
      const foodFill = DOM.get("food-fill");
      if (foodFill) foodFill.style.width = `${Helpers.clamp(food, 0, 100)}%`;
    }
   
    if (water !== undefined) {
      const waterFill = DOM.get("water-fill");
      if (waterFill) waterFill.style.width = `${Helpers.clamp(water, 0, 100)}%`;
    }
  },
 
  processData: function(data) {
    if (data.playerId !== undefined) this.updatePlayerId(data.playerId);
    if (data.job !== undefined) this.updateJob(data.job);
   
    if (data.showSpeedo !== undefined || data.speed !== undefined ||
        data.rpm !== undefined || data.gear !== undefined || data.fuel !== undefined) {
      this.updateSpeedometer(data);
    }
   
    if (data.seatbelt !== undefined) this.updateSeatbelt(data.seatbelt);
    if (data.seatbeltWarning !== undefined) this.updateSeatbelt(undefined, data.seatbeltWarning);
    if (data.engineHealth !== undefined) this.updateEngine(data.engineHealth);
    if (data.cash !== undefined) this.updateCash(data.cash);
    if (data.voiceRange) this.updateVoiceRange(data.voiceRange);
    if (data.health !== undefined || data.armor !== undefined) {
      this.updateHealthArmor(data.health, data.armor);
    }
   
    if (data.food !== undefined || data.water !== undefined) {
      this.updateNeeds(data.food, data.water);
    }
   
    if (data.playWarningSound !== undefined) {
      this.playSeatbeltWarning(data.playWarningSound);
    }
   
    if (data.playSound !== undefined) {
      if (data.playSound === "buckle") {
        this.seatbeltOnSound.currentTime = 0;
        this.seatbeltOnSound.play().catch(e => console.error("Error playing buckle sound:", e));
      } else if (data.playSound === "unbuckle") {
        this.seatbeltOffSound.currentTime = 0;
        this.seatbeltOffSound.play().catch(e => console.error("Error playing unbuckle sound:", e));
      }
    }
  }
};

window.addEventListener("DOMContentLoaded", () => UI.init());
window.addEventListener("message", function(event) {
  UI.processData(event.data);
});

document.addEventListener('keydown', function(event) {
  if (event.keyCode === CONFIG.keys.seatbelt && UI.inVehicle) {
    UI.toggleSeatbelt();
   
    fetch(`https://${GetParentResourceName()}/toggleSeatbelt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({
        isBuckled: UI.isSeatbeltOn
      })
    }).catch(error => console.error('Error:', error));
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
   
    .animate-pulse {
      animation: pulse 1s infinite;
    }
   
    #gear-display .gear {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      text-align: center;
      background-color: rgba(31, 41, 55, 0.7);
      color: #9ca3af;
      border-radius: 50%;
      font-size: 12px;
      margin: 0 2px;
    }
   
    #gear-display .gear.active {
      background-color: #22c55e;
      color: white;
    }
  `;
  document.head.appendChild(style);
});
