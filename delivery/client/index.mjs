import * as alt from 'alt-client';
import * as native from 'natives';
import { notify } from './clientNotify.mjs';
import { createDeliveryMarker, removeDeliveryMarker, createPoliceZones, removePoliceZones } from './markers.mjs';
import { debounce } from './utils/timers.mjs';
import { VehicleBlocker } from './VehicleBlocker.mjs';

let deliveryBlip = null;
const blocker = new VehicleBlocker();

alt.onServer('delivery:begin', async (data) => {
    const pickup = data.pickup; // { x, y, z }

    const [found, groundZ] = native.getGroundZFor3dCoord(pickup.x, pickup.y, pickup.z ?? 1000, 0, false);
    const z = found ? groundZ : pickup.z;

    native.setEntityCoords( // teleport player to pickup
        alt.Player.local.scriptID,
        pickup.x + 10,
        pickup.y + 2,
        z,
        false, false, false, true
    );

    // Make marker
    const loadCfg = data.loadBlip;
    createDeliveryMarker({
        x: pickup.x, y: pickup.y, z,
        marker: loadCfg.marker,
        radius: loadCfg.radius,
        color: loadCfg.color,
        scale: loadCfg.scale,
        type: loadCfg.type
    });

    notify('Доставка началась! Следуйте к точке погрузки.');

    // Make blip
    if (deliveryBlip) native.removeBlip(deliveryBlip);
    deliveryBlip = native.addBlipForCoord(pickup.x, pickup.y, z);
    native.setBlipSprite(deliveryBlip, loadCfg.blip);
    native.setBlipColour(deliveryBlip, loadCfg.color);
    native.setBlipScale(deliveryBlip, loadCfg.scale);
    native.beginTextCommandSetBlipName('STRING');
    native.addTextComponentSubstringPlayerName('Точка погрузки');
    native.endTextCommandSetBlipName(deliveryBlip);
});

alt.onServer('delivery:removeDeliveryVisuals', () => { 
    if (deliveryBlip) {
        native.removeBlip(deliveryBlip);
        deliveryBlip = null;
    }
    removeDeliveryMarker();
});

alt.onServer('delivery:setDropoff', async (data) => {
    const dropoff = data.dropoff;
    const blipCfg = data.blip;

    const [found, groundZ] = native.getGroundZFor3dCoord(dropoff.x, dropoff.y, dropoff.z ?? 1000, 0, false);
    const z = found ? groundZ : dropoff.z;

    createDeliveryMarker({
        x: dropoff.x, y: dropoff.y, z,
        marker: blipCfg.marker,
        radius: blipCfg.radius,
        color: blipCfg.color,
        scale: blipCfg.scale,
        type: blipCfg.type
    });

    if (deliveryBlip) native.removeBlip(deliveryBlip);
    deliveryBlip = native.addBlipForCoord(dropoff.x, dropoff.y, z);
    native.setBlipSprite(deliveryBlip, blipCfg.blip);
    native.setBlipColour(deliveryBlip, blipCfg.color );
    native.setBlipScale(deliveryBlip, blipCfg.scale);
    native.beginTextCommandSetBlipName('STRING');
    native.addTextComponentSubstringPlayerName('Точка разгрузки');
    native.endTextCommandSetBlipName(deliveryBlip);
});

alt.onServer('delivery:notify', (data) => {
    notify(data.text);
});

alt.onServer('delivery:moneyAdded', (data) => {
    const amt = data.amount;
    const cash = data.cash;
    const bank = data.bank;
    const account = data.account;
    notify(`💵 +$${amt} (${account}) — Нал: $${cash} | Банк: $${bank}`);
});

const debouncedShowPoliceZones = debounce((stations) => {
    alt.log(`[client] showPoliceZones received, stations=${(stations || []).length}`);
    createPoliceZones(stations || []);
}, 200);

alt.onServer('delivery:showPoliceZones', (data) => {
    debouncedShowPoliceZones(data.stations);
});

alt.onServer('delivery:hidePoliceZones', () => {
    alt.log('[client] hidePoliceZones received');
    removePoliceZones();
});

alt.onServer('delivery:startLoad', (data) => {
    const { vehicleId, duration = 3000 } = data;
    const player = alt.Player.local;
    const veh = player.vehicle;

    if (!veh || veh.id !== vehicleId) return;

    blocker.block(vehicleId, duration);
});

alt.onServer('delivery:requestGroundZ', (id, position) => {
    const [found, groundZ] = native.getGroundZFor3dCoord(position.x, position.y, position.z, 0, false);
    const z = found ? groundZ : position.z;
    alt.emitServer('delivery:returnGroundZ', id, z);
});

alt.onServer('delivery:explodeVehicle', (vehicleId) => {
    const veh = alt.Vehicle.all.find(v => v && v.valid && v.id === vehicleId);
    let pos = null;

    if (veh && veh.valid) {
        pos = veh.pos;
    } else {
        pos = alt.Player.local.pos;
    }

    if (!pos) return;

    native.addExplosion(pos.x, pos.y, pos.z, 2, 10.0, true, false, 1.0, 0);
});