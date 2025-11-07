import * as alt from 'alt-server';
import { CargoBase } from './CargoBase.mjs';

export class DangerCargo extends CargoBase {
    constructor() {
        super('danger');
        this._onDamage = null;
    }

    start(player) {
        super.start(player);
        alt.emitClient(player, 'delivery:notify', { text: 'Осторожно! Взрывоопасный груз.' });

        // Subscribe to vehicle damage
        this._onDamage = (vehicle) => {
            if (!this.active) return;

            if (!player || !player.valid) return;
            if (!player.vehicle) return;

            if (vehicle && player.vehicle && vehicle.id === player.vehicle.id) {
                alt.emitClient(player, 'delivery:explodeVehicle', vehicle.id);

                alt.setTimeout(() => {
                    if (vehicle && vehicle.valid) vehicle.destroy();
                }, 150);

                this.fail(player, 'Груз взорвался!');
            }
        };
        alt.on('vehicleDamage', this._onDamage);
    }

    fail(player, reason) {
        super.fail(player, reason);
        this.cleanup();
    }

    success(player) {
        super.success(player);
        this.cleanup();
        const reward = 3000;
        this.giveReward(player, reward); 

        alt.emitClient(player, 'delivery:notify', { text: `Опасный груз доставлен! Вы получили $${reward}.` });
    }

    cleanup() {
        if (this._onDamage) {
            alt.off('vehicleDamage', this._onDamage);
            this._onDamage = null;
        }
    }

    destroy() {
        this.cleanup();
        super.destroy();
    }
}
