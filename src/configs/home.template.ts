export const HOME_TEMPLATE = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Go Ossetia</title>
    <link rel="icon" type="image/x-icon" href="/static/favicon.ico">
    <link rel="stylesheet" href="/static/styles.css">

    <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
    * {
        font-family: 'Montserrat', sans-serif;
        box-sizing: border-box;
    }
    .api-docs-link {
        font-size: 32px;
        font-weight: bold;
        color: #darkgray;
        text-decoration: none;
    }

    .api-docs-link:hover {
        text-decoration: underline;
    }
    </style>
</head>
<body>
    <header>
        <h1>Добро пожаловать в Go Ossetia!</h1>
        <a class="api-docs-link" href="/api/open-api">Документация API</a>
    </header>
    <main>
        <section>
            <h2>О проекте</h2>
            <p>Go Ossetia - это платформа для организации и проведения мероприятий в Осетии.</p>
        </section>
        <section>
            <h2>Контакты</h2>
            <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нами по адресу <a href="mailto:support@go-ossetia.com">support@go-ossetia.com</a>.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2023 Go Ossetia. Все права защищены.</p>
    </footer>
</body>
</html>
`;
