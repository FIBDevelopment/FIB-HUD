# 📟 FIB HUD — Immersive and Modular HUD for ESX  
(*QBCore & Config Support Coming Soon*)

FIB HUD is a modern, performance-optimized HUD for FiveM servers using ESX. It displays all essential player and vehicle information in a clean and immersive UI — perfect for serious roleplay environments.

> ⚠️ **Note:** This is an early-access open-source version. Currently, customization is only possible via code. A full config system and GUI customization are planned for the next update.

---

## 🔗 Fast Support

👉 **Join the FIB Development Discord:** [https://discord.gg/9Z8mDBjtR8](https://discord.gg/9Z8mDBjtR8)

---

## ✅ Current Features

### 🧍 Player HUD

- 💵 **Cash Display:** Live wallet updates  
- 🆔 **Player Info:** Player ID and job display with color coding  
- 🔊 **Voice Range Indicator:** Integrated with `pma-voice` and `mumble-voip` (whisper, normal, shout)  
- ❤️ **Status Bars:** Health, armor, hunger, and thirst (`esx_status`)

### 🚗 Vehicle HUD

- Speed, animated RPM, and gear display  
- Fuel gauge with warning levels  
- Engine health indicator  
- Seatbelt status and warnings

### 🔒 Seatbelt System

- Toggle with the `G` key  
- Buckle/unbuckle sound effects  
- Prevents exit while buckled  
- Auto warnings at high speeds

---

## 🔜 Coming Soon

- ✅ **QBCore** support  
- ⚙️ `config.lua` for easy server-side customization  
- 🎛️ **In-Game HUD Editor**:  
  - Enable/disable HUD elements  
  - Drag-and-drop positioning  
  - Save personal layouts per player  
- 💡 New HUD indicators and modules

---

## 🛠️ Built With

- **Frontend:** HTML, JS, TailwindCSS  
- **Modular file structure:**  
  - `main.lua` – Core logic  
  - `seatbelt.lua` – Seatbelt system  
  - `hud.js` – Frontend logic  
  - `index.html` – UI layout

---

## 📦 Dependencies

- `es_extended`  
- `esx_status`  
- `pma-voice` **or** `mumble-voip`

---

## 📥 Installation

1. Place the resource in your `resources` folder  
2. Make sure all dependencies are started first  
3. Add this line to your `server.cfg`:

   ```cfg
   ensure fib_hud 

![layout](https://github.com/user-attachments/assets/f0bf5f28-d46d-4f89-8215-817610bdf2e3)
