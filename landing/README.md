# MVPBot Landing

Статический лендинг MVPBot на HTML/CSS/JS без сборки.

## Запуск

1. Откройте `/Users/konstantin/Documents/Dev/codex5.3/landing/index.html` двойным кликом в браузере.
2. Альтернатива: поднимите простой локальный сервер (например, `python3 -m http.server`) и откройте страницу по `http://localhost:8000`.

## Структура

- `index.html` — вся разметка страницы
- `css/styles.css` — единый файл стилей
- `js/utils.js` — расчеты и утилиты (`TOKEN_PRICE_RUB` и рендер расчета токенов)
- `js/animations.js` — reveal-анимации, canvas-анимация hero, lazy hook для Lottie
- `js/forms.js` — валидация, отправка формы, модальное окно с focus trap
- `js/main.js` — инициализация всех блоков

## Настройка endpoint формы

Форма использует `data-endpoint` в `index.html`:

```html
<form data-endpoint="https://formspree.io/f/your-form-id">
```

Замените значение на ваш endpoint Formspree (или другой API URL), например:

```html
<form data-endpoint="https://formspree.io/f/abcde123">
```

Если endpoint оставлен как `your-form-id`, используется безопасный mock-submit (демо-режим без реальной отправки).

## Lottie (опционально)

Сейчас в hero используется canvas-анимация. Чтобы подключить Lottie:

1. Добавьте JSON-файл в `/Users/konstantin/Documents/Dev/codex5.3/landing/assets/lottie`.
2. Создайте контейнер, например:

```html
<div data-lottie-src="assets/lottie/hero.json"></div>
```

3. `js/animations.js` автоматически загрузит `lottie-web` лениво при появлении блока в viewport.

## Accessibility

- Семантическая структура (`header`, `main`, `section`, `footer`)
- `skip-link`
- Клавиатурная навигация
- Модальное окно закрывается по `Esc` и держит фокус внутри
- Учет `prefers-reduced-motion`
