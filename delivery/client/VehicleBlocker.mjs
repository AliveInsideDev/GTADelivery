import * as alt from 'alt-client';
import * as native from 'natives';
import { notify } from './clientNotify.mjs';

export class VehicleBlocker {
    constructor() {
        this.active = false;
        this.vehicleId = null;
        this.interval = null;
        this.tick = null;
    }

    block(vehicleId, duration = 3000) {
        if (this.active) this.unblock();

        this.vehicleId = vehicleId;
        this.active = true;

        notify('Погрузка началась...');

        let seconds = Math.floor(duration / 1000);
        if (this.interval) clearInterval(this.interval);

        this.interval = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                notify(`Погрузка... ${seconds} сек`);
            } else {
                this.unblock();
            }
        }, 1000);

        this._startTick();
    }

    unblock() {
        if (!this.active) return;

        this.active = false;

        const vehicleId = this.vehicleId;

        this.vehicleId = null;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        if (this.tick) {
            alt.clearEveryTick(this.tick);
            this.tick = null;
        }

        const veh = alt.Vehicle.all.find(v => v && v.valid && v.id === vehicleId);
        if (veh) native.setVehicleEngineOn(veh.scriptID, true, true, true);

        notify('Погрузка завершена! Езжайте на разгрузку.');
    }

    _startTick() {
        if (this.tick) return;

        this.tick = alt.everyTick(() => {
            if (!this.active) {
                alt.clearEveryTick(this.tick);
                this.tick = null;
                return;
            }

            const player = alt.Player.local;
            const veh = player.vehicle;

            if (!veh || veh.id !== this.vehicleId) {
                this.unblock();
                return;
            }

            const disableControls = [30, 31, 32, 33, 34, 35, 59, 60, 71, 72, 76, 23, 75];
            for (const ctrl of disableControls) native.disableControlAction(0, ctrl, true);

            // Enable camera
            native.enableControlAction(0, 1, true);
            native.enableControlAction(0, 2, true);

            // Disable engine
            native.setVehicleEngineOn(veh.scriptID, false, true, true);
        });
    }
}