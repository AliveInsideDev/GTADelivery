import * as alt from 'alt-server';
import { CargoBase } from './CargoBase.mjs';

export class CommonCargo extends CargoBase {
    constructor() {
        super('common');
    }

    start(player) {
        super.start(player);
        alt.emitClient(player, 'delivery:notify', { text: 'Обычный груз.' });
    }

    success(player) {
        super.success(player);
        const reward = 1000;
        this.giveReward(player, reward);

        alt.emitClient(player, 'delivery:notify', { text: `Обычный груз доставлен! Вы получили $${reward} за доставку.` });
    }
}
