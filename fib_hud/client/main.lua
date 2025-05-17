local ESX = exports["es_extended"]:getSharedObject()
local modeMap = {
    [1] = "whisper",
    [2] = "normal",
    [3] = "shout"
}

local function debugLog(message, ...)
    local debug = false
    if debug then
        print(string.format("[FIB_HUD] %s", message:format(...)))
    end
end

local function getCashFromAccounts(accounts)
    if type(accounts) ~= "table" then return 0 end
    for _, account in pairs(accounts) do
        if account.name == "money" then
            return tonumber(account.money) or 0
        end
    end
    return 0
end

local function safeSendCashToUI(value)
    local num = tonumber(value)
    if not num or num < 0 then num = 0 end
    debugLog("sending cash to UI: %s", num)
    SendNUIMessage({ cash = num })
end

local function getPlayerNeedsStatus()
    local food, water = 100, 100
    local foodStatus, waterStatus
    
    TriggerEvent('esx_status:getStatus', 'hunger', function(status)
        foodStatus = status
    end)
    
    TriggerEvent('esx_status:getStatus', 'thirst', function(status)
        waterStatus = status
    end)
    
    Wait(0)
    
    if foodStatus then food = foodStatus.getPercent() end
    if waterStatus then water = waterStatus.getPercent() end
    
    return food, water
end

local function playSound(soundName, volume)
    SendNUIMessage({
        playSound = soundName,
        soundVolume = volume or 0.5
    })
    debugLog("played sound: %s (volume: %s)", soundName, volume or 0.5)
end

local function updateAllUIElements()
    if not ESX or not ESX.IsPlayerLoaded or not ESX.IsPlayerLoaded() then
        SetTimeout(500, updateAllUIElements)
        return
    end
    
    local playerData = ESX.GetPlayerData()
    local cash = getCashFromAccounts(playerData.accounts)
    local playerId = GetPlayerServerId(PlayerId())
    local proximity = LocalPlayer.state.proximity
    local voiceRange = proximity and proximity.index and modeMap[proximity.index] or "normal"
    local food, water = getPlayerNeedsStatus()
    local ped = PlayerPedId()
    local health = GetEntityHealth(ped) - 100
    if health < 0 then health = 0 end
    local armor = GetPedArmour(ped)
    
    SendNUIMessage({
        cash = cash,
        playerId = playerId,
        job = playerData.job,
        voiceRange = voiceRange,
        food = food,
        water = water,
        health = health,
        armor = armor
    })
    
    debugLog("all UI elements updated")
end

AddEventHandler("onClientResourceStart", function(resource)
    if resource == GetCurrentResourceName() then
        CreateThread(function()
            while not NetworkIsPlayerActive(PlayerId()) do
                Wait(50)
            end
            
            local ped = PlayerPedId()
            if not IsPedInAnyVehicle(ped, false) then
                SendNUIMessage({
                    showSpeedo = false,
                    speed = 0,
                    rpm = 0,
                    gear = "",
                    engineHealth = 0,
                    seatbelt = false,
                    fuel = 0
                })
            end
            
            Wait(1000)
            updateAllUIElements()
        end)
    end
end)

RegisterNetEvent("pma-voice:setTalkingMode")
AddEventHandler("pma-voice:setTalkingMode", function(mode)
    if mode and modeMap[mode] then
        local voiceRange = modeMap[mode]
        SendNUIMessage({ 
            voiceRange = voiceRange 
        })
    end
end)

RegisterNetEvent("pma-voice:radioActive")
AddEventHandler("pma-voice:radioActive", function(radioTalking)
end)

RegisterNetEvent("mumble:SetVoiceData")
AddEventHandler("mumble:SetVoiceData", function(key, value)
    if key == "mode" or key == "radioChannel" or key == "callChannel" then
        local proximity = LocalPlayer.state.proximity
        local voiceRange = proximity and proximity.index and modeMap[proximity.index] or "normal"
        
        SendNUIMessage({ 
            voiceRange = voiceRange 
        })
    end
end)

CreateThread(function()
    while true do
        Wait(1000)
        
        local proximity = LocalPlayer.state.proximity
        if proximity and proximity.index then
            local voiceRange = modeMap[proximity.index] or "normal"
            
            SendNUIMessage({ 
                voiceRange = voiceRange 
            })
        end
    end
end)

RegisterNetEvent("hud:updateCash", function(cash)
    safeSendCashToUI(cash)
end)

RegisterNetEvent('hud:updateFood')
AddEventHandler('hud:updateFood', function(amount)
    local food, water = getPlayerNeedsStatus()
    SendNUIMessage({
        food = food
    })
end)

RegisterNetEvent('hud:updateWater')
AddEventHandler('hud:updateWater', function(amount)
    local food, water = getPlayerNeedsStatus()
    SendNUIMessage({
        water = water
    })
end)

RegisterNetEvent('esx:setJob')
AddEventHandler('esx:setJob', function(job)
    SendNUIMessage({
        job = job
    })
    debugLog("updated job: %s - %s", job.name, job.label)
end)

RegisterNetEvent('esx:playerLoaded', function(playerData)
    local cash = getCashFromAccounts(playerData.accounts)
    local playerId = GetPlayerServerId(PlayerId())
    local proximity = LocalPlayer.state.proximity
    local voiceRange = proximity and proximity.index and modeMap[proximity.index] or "normal"
    local food, water = getPlayerNeedsStatus()
    
    SendNUIMessage({
        cash = cash,
        playerId = playerId,
        job = playerData.job,
        voiceRange = voiceRange,
        food = food,
        water = water
    })
    
    debugLog("player loaded: All UI elements updated")
end)

CreateThread(function()
    while not ESX.PlayerLoaded do
        Wait(100)
    end
    
    updateAllUIElements()
end)

local currentSeatbelt = false

CreateThread(function()
    local hudVisible = false
    local lastSpeed = 0
    local lastRpm = 0
    local lastGear = ""
    local lastEngineHealth = 0
    local lastFuel = 0
    local lastSeatbeltWarning = false
    local seatbeltWarningTimer = 0
    
    while true do
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)
        
        if veh ~= 0 then
            local speed = GetEntitySpeed(veh) * 3.6
            local rpm = GetVehicleCurrentRpm(veh)
            local gearNum = GetVehicleCurrentGear(veh)
            local gear = gearNum == 0 and "R" or tostring(gearNum)
            local engineHealth = GetVehicleEngineHealth(veh)
            local engineRunning = GetIsVehicleEngineRunning(veh)
            local fuelLevel = GetVehicleFuelLevel(veh) or 100
            local seatbeltWarning = speed > 40 and not currentSeatbelt

            if not hudVisible or 
               math.abs(lastSpeed - speed) > 1 or 
               math.abs(lastRpm - rpm) > 0.05 or 
               lastGear ~= gear or 
               math.abs(lastEngineHealth - engineHealth) > 5 or 
               math.abs(lastFuel - fuelLevel) > 1 or 
               lastSeatbeltWarning ~= seatbeltWarning then
                
                SendNUIMessage({
                    showSpeedo = true,
                    speed = speed,
                    rpm = rpm,
                    gear = gear,
                    engineHealth = engineRunning and engineHealth or 0,
                    seatbelt = currentSeatbelt,
                    fuel = fuelLevel,
                    seatbeltWarning = seatbeltWarning
                })
                
                if seatbeltWarning and not lastSeatbeltWarning then
                    seatbeltWarningTimer = GetGameTimer()
                    playSound("seatbelt_warning", 0.4)
                elseif seatbeltWarning and GetGameTimer() - seatbeltWarningTimer > 5000 then
                    seatbeltWarningTimer = GetGameTimer()
                    playSound("seatbelt_warning", 0.4)
                end
                
                lastSpeed = speed
                lastRpm = rpm
                lastGear = gear
                lastEngineHealth = engineHealth
                lastFuel = fuelLevel
                lastSeatbeltWarning = seatbeltWarning
                hudVisible = true
            end
            
            if speed > 100 then
                Wait(50)
            elseif speed > 50 then
                Wait(100)
            else
                Wait(200)
            end
        elseif hudVisible then
            SendNUIMessage({
                showSpeedo = false
            })
            
            Wait(50)
            
            SendNUIMessage({
                speed = 0,
                rpm = 0,
                gear = "",
                engineHealth = 0,
                seatbelt = false,
                fuel = 0,
                seatbeltWarning = false
            })
            
            hudVisible = false
            Wait(1000)
        else
            Wait(1000)
        end
    end
end)

RegisterNetEvent("seatbelt:changed", function(status)
    currentSeatbelt = status
    SendNUIMessage({
        seatbelt = status
    })
    
    if status then
        playSound("seatbelt_on", 0.5)
    else
        playSound("seatbelt_off", 0.5)
    end
end)

CreateThread(function()
    local lastHealth = 100
    local lastArmor = 0
    
    while true do
        local ped = PlayerPedId()
        local health = GetEntityHealth(ped) - 100
        if health < 0 then health = 0 end
        local armor = GetPedArmour(ped)

        if math.abs(lastHealth - health) > 1 or math.abs(lastArmor - armor) > 1 then
            SendNUIMessage({
                health = health,
                armor = armor
            })
            
            lastHealth = health
            lastArmor = armor
        end
        
        if health < 50 or armor > 0 then
            Wait(200)
        else
            Wait(500)
        end
    end
end)

CreateThread(function()
    local lastFood = 100
    local lastWater = 100
    
    while true do
        local food, water = getPlayerNeedsStatus()
        
        if math.abs(lastFood - food) > 1 or math.abs(lastWater - water) > 1 then
            SendNUIMessage({
                food = food,
                water = water
            })
            
            lastFood = food
            lastWater = water
            debugLog("Food and drink bars updated: Food = %s, Drink = %s", food, water)
        end
        
        if food < 30 or water < 30 then
            Wait(3000)
        else
            Wait(5000)
        end
    end
end)

RegisterNUICallback("nuiReady", function(_, cb)
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then
        SendNUIMessage({
            showSpeedo = false,
            speed = 0,
            rpm = 0,
            gear = "",
            engineHealth = 0,
            seatbelt = false,
            fuel = 0
        })
    end

    updateAllUIElements()
    
    cb({})
end)

RegisterNetEvent("esx:setAccountMoney", function(account)
    if account.name == "money" then
        safeSendCashToUI(account.money)
    end
end)

CreateThread(function()
    local lastCash = 0
    
    while true do
        if ESX and ESX.IsPlayerLoaded and ESX.IsPlayerLoaded() then
            local playerData = ESX.GetPlayerData()
            local cash = getCashFromAccounts(playerData.accounts)
            if lastCash ~= cash then
                safeSendCashToUI(cash)
                lastCash = cash
            end
        end
        Wait(5000)
    end
end)

exports('updateFood', function()
    local food, water = getPlayerNeedsStatus()
    SendNUIMessage({
        food = food
    })
end)

exports('updateWater', function()
    local food, water = getPlayerNeedsStatus()
    SendNUIMessage({
        water = water
    })
end)

