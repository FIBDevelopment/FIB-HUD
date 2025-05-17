local isSeatbeltOn = false
local isExitingVehicle = false

RegisterNUICallback('toggleSeatbelt', function(data, cb)
    local isBuckled = data.isBuckled
    isSeatbeltOn = isBuckled
    TriggerEvent('seatbelt:changed', isSeatbeltOn)
   
    if isSeatbeltOn then
        SendNUIMessage({playSound = "buckle"})
    else
        SendNUIMessage({playSound = "unbuckle"})
    end
   
    cb({})
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        local playerPed = PlayerPedId()
        local vehicle = GetVehiclePedIsIn(playerPed, false)
       
        if vehicle ~= 0 then
            if IsControlJustPressed(0, 47) then
                isSeatbeltOn = not isSeatbeltOn
                SendNUIMessage({
                    seatbelt = isSeatbeltOn
                })
               
                TriggerEvent('seatbelt:changed', isSeatbeltOn)
                if isSeatbeltOn then
                    SendNUIMessage({playSound = "buckle"})
                else
                    SendNUIMessage({playSound = "unbuckle"})
                end
            end
            
            if isSeatbeltOn then
                if IsControlJustPressed(0, 75) then
                    TriggerEvent("chat:addMessage", {
                        color = {255, 0, 0},
                        multiline = true,
                        args = {"System", "You must first unfasten your seatbelt (G key)!"}
                    })
                    isExitingVehicle = true
                    Citizen.Wait(100)
                    isExitingVehicle = false
                end
                DisableControlAction(0, 75, true)
            else
                EnableControlAction(0, 75, true)
            end
        else
            if isSeatbeltOn then
                isSeatbeltOn = false
                SendNUIMessage({
                    seatbelt = false
                })
                TriggerEvent('seatbelt:changed', false)
            end
            Citizen.Wait(500)
        end
    end
end)

Citizen.CreateThread(function()
    while true do
        Citizen.Wait(0)
        
        local playerPed = PlayerPedId()
        local vehicle = GetVehiclePedIsIn(playerPed, false)
        
        if vehicle == 0 or not isSeatbeltOn then
            EnableControlAction(0, 75, true)
        end
    end
end)


exports('isSeatbeltOn', function()
    return isSeatbeltOn
end)
