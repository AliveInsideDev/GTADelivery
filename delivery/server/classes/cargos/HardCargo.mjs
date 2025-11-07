import * as alt from 'alt-server';
import { CargoBase } from './CargoBase.mjs';

export class HardCargo extends CargoBase {
    constructor() {
        super('hard');
        this._onVehicleDamage = null;
        this._onPlayerDamage = null;
    }

    start(player) {
        super.start(player);
        alt.emitClient(player, 'delivery:notify', { text: 'Осторожно! Хрупкий груз.' });

        // Subscribe to vehicle damage
        this._onVehicleDamage = (vehicle) => {
            if (!this.active) return;
            if (vehicle && player.vehicle && vehicle.id === player.vehicle.id) {
                this.fail(player, 'Транспорт был повреждён!');
            }
        };
        alt.on('vehicleDamage', this._onVehicleDamage);

        // Subscribe to player damage
        this._onPlayerDamage = (entry) => {
            if (!this.active) return;
            if (entry === player) {
                this.fail(player, 'Вы получили урон!');
            }
        };
        alt.on('playerDamage', this._onPlayerDamage);
    }

    fail(player, reason) {
        super.fail(player, reason);
        this.cleanup();
    }

    success(player) {
        super.success(player);
        this.cleanup();
        const reward = 2000;
        this.giveReward(player, reward);
        alt.emitClient(player, 'delivery:notify', { text: `Хрупкий груз доставлен! Вы получили $${reward}.` });
    }

    cleanup() {
        if (this._onVehicleDamage) alt.off('vehicleDamage', this._onVehicleDamage);
        if (this._onPlayerDamage) alt.off('playerDamage', this._onPlayerDamage);
        this._onVehicleDamage = null;
        this._onPlayerDamage = null;
    }

    destroy() {
        this.cleanup();
        super.destroy();
    }
}
