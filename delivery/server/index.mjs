import * as alt from 'alt-server';
import { DeliveryJob } from './classes/DeliveryJob.mjs';

alt.log('Server started');

alt.on('consoleCommand', async (cmd, ...args) => {
    if (cmd !== 'delivery') return;

    const sub = args[0];
    if (sub === 'start') {
        const player = [...alt.Player.all][0];
        if (!player) return alt.log('Нет игроков онлайн');

        const job = new DeliveryJob(player);
        job.start();
    }
});

alt.on('economy:addMoney', (player, amount, account = 'cash') => {
    if (!player || !player.valid) return;

    const num = amount;
    const meta = (player.getMeta && player.getMeta('economy')) || { cash: 0, bank: 0 };
    if (account === 'bank') meta.bank += num;
    else meta.cash += num;

    if (player.setMeta) player.setMeta('economy', meta);

    alt.log(`[ECONOMY] Добавлено $${num} (${account}) игроку ${player.name}. Баланс cash=$${meta.cash} bank=$${meta.bank}`);
    alt.emitClient(player, 'delivery:moneyAdded', { amount: num, cash: meta.cash, bank: meta.bank, account });
});

alt.on('consoleCommand', (cmd, ...args) => {
    if (cmd !== 'delivery') return;

    const sub = args[0];
    if (sub === 'bal') {
        const player = [...alt.Player.all][0];
        if (!player) return alt.log('Нет игроков онлайн');
        
        const meta = player.getMeta && player.getMeta('economy');
        alt.log(`[ECONOMY] Баланс ${player.name}: cash=$${meta.cash} bank=$${meta.bank}`);
    }
});