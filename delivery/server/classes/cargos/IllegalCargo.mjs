import * as alt from 'alt-server';
import { CargoBase } from './CargoBase.mjs';

export class IllegalCargo extends CargoBase {
    constructor(policeStations = []) {
        super('illegal');
        this.policeStations = policeStations;
        this._interval = null;
    }

    start(player) {
        super.start(player);
        alt.emitClient(player, 'delivery:notify', { text: 'Осторожно! Незаконный груз.' });

        this._interval = alt.setInterval(() => {
            if (!this.active || !player || !player.valid) return;

            const pos = player.pos;
            for (const station of this.policeStations) {
                const dx = pos.x - station.x;
                const dy = pos.y - station.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const detectRadius = station.radius;
                if (dist < detectRadius) {
                    this.fail(player, 'Полиция обнаружила груз!');
                    break;
                }
            }
        }, 2000);
    }

    success(player) {
        super.success(player);
        this.cleanup();
        const reward = 1500;
        this.giveReward(player, reward, 'bank');
        alt.emitClient(player, 'delivery:notify', { text: `Незаконный груз доставлен! Вы получили $${reward} (на банк).` });
    }

    fail(player, reason) {
        super.fail(player, reason);
        this.cleanup();
    }

    cleanup() {
        if (this._interval) {
            alt.clearInterval(this._interval);
            this._interval = null;
        }
    }

    destroy() {
        this.cleanup();
        super.destroy();
    }
}
