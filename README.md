# Техническое задание: Система доставки грузов


Структура
---
- `server/`
  - `index.mjs` — точка входа
  - `config.mjs` — все конфигурации
  - `classes/`
    - `DeliveryJob.mjs` — основной контроллер доставки
    - `PointBase.mjs`, `PointLoad.mjs`, `PointUnload.mjs` — точки доставки
    - `cargos/` — классы грузов: `CargoBase.mjs`, `CommonCargo.mjs`, `HardCargo.mjs`, `DangerCargo.mjs`, `IllegalCargo.mjs`.
  - `utils/` — вспомогательные функции

- `client/`
  - `index.mjs` — клиентские обработчики событий
  - `markers.mjs` — отрисовка маркеров и зон
  - `VehicleBlocker.mjs` — блокировка управления транспорта
  - `utils/` — вспомогательные функции для клиента.

Как запустить / тестировать
---
1. Скопируйте ресурс в `resources/` сервера и добавьте в `server.toml`
2. В консоли сервера:
   - `restart delivery` — перезапустить ресурс
   - `delivery start` — запустить пример задания
   - `delivery bal` — показать баланс первого игрока
