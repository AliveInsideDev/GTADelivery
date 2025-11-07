import * as alt from 'alt-server';

export class CargoBase {
    constructor(type = 'common') {
        this.type = type;
        this.active = false;
    }

    start(player) {
        this.active = true;
    }

    fail(player, reason = 'Ошибка доставки') {
        if (!this.active) return;
        this.active = false;

        alt.emitClient(player, 'delivery:notify', { text: `Доставка провалена: ${reason}` });
        alt.emit('delivery:cargoFailed', player);
    }

    success(player) {
        if (!this.active) return;
        this.active = false;

        alt.emitClient(player, 'delivery:notify', { text: `Доставка типа "${this.type}" успешно выполнена!` });
    }

    giveReward(player, amount, account = 'cash') {
        alt.emit('economy:addMoney', player, amount, account);
    }

    destroy() {
        this.active = false;
    }
}
