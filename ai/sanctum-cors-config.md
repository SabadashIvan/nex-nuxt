# Laravel Sanctum CORS Configuration

Повна документація налаштувань CORS та Cookies для роботи Nuxt 4 фронтенду з Laravel Sanctum API на різних доменах.

## Контекст

- **Фронтенд**: Nuxt 4, SSR увімкнено, `http://localhost:3000` (development) або `https://nexora-room15.store` (production)
- **Бекенд**: Laravel 11 (Sanctum), `https://api.nexora-room15.store`
- **Авторизація**: Cookie-based (Laravel Sanctum SPA authentication)

## 1. Налаштування `.env` файлу Laravel

### Обов'язкові параметри

```env
# Session domain - має відповідати домену фронтенду
# Для development: localhost
# Для production: .nexora-room15.store (з крапкою на початку для піддоменів)
SESSION_DOMAIN=.nexora-room15.store

# Sanctum stateful domains - список доменів, які можуть використовувати cookie-based auth
# Розділяти комами для кількох доменів
SANCTUM_STATEFUL_DOMAINS=localhost:3000,nexora-room15.store,www.nexora-room15.store

# Session driver - обов'язково cookie
SESSION_DRIVER=cookie

# Session lifetime (в хвилинах)
SESSION_LIFETIME=120

# Session cookie name
SESSION_COOKIE=laravel_session

# Session cookie path
SESSION_PATH=/

# Session cookie secure - true для HTTPS, false для HTTP (development)
SESSION_SECURE_COOKIE=true

# SameSite cookie attribute - важливо для cross-domain requests
SESSION_SAME_SITE=lax

# Frontend URL (для redirects та інших цілей)
FRONTEND_URL=http://localhost:3000
```

### Додаткові параметри (опціонально)

```env
# Session encryption
SESSION_ENCRYPTION=true

# Session HTTP only - завжди true для безпеки
SESSION_HTTP_ONLY=true

# Sanctum middleware - зазвичай 'web'
SANCTUM_MIDDLEWARE=web

# Sanctum expiration (в хвилинах)
SANCTUM_EXPIRATION=null
```

## 2. Налаштування `config/cors.php`

### Повна конфігурація

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie',
        'login',
        'register',
        'logout',
        'forgot-password',
        'reset-password',
        'verify-email/*',
        'email/verification-notification',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'https://nexora-room15.store',
        'https://www.nexora-room15.store',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true, // КРИТИЧНО: має бути true для cookie-based auth
];
```

### Пояснення параметрів

#### `paths`
Масив шляхів, для яких застосовуються CORS правила. Обов'язково включити:
- `api/*` - всі API endpoints
- `sanctum/csrf-cookie` - ендпоінт для отримання CSRF cookie
- `login`, `register`, `logout` - auth endpoints
- `forgot-password`, `reset-password` - password reset endpoints
- `verify-email/*` - email verification
- `email/verification-notification` - resend verification email

#### `allowed_methods`
Дозволені HTTP методи. `['*']` дозволяє всі методи (GET, POST, PUT, PATCH, DELETE, OPTIONS).

#### `allowed_origins`
Масив дозволених origins (доменів фронтенду). **ВАЖЛИВО**: Не використовувати wildcard `*` разом з `supports_credentials: true`.

Для development:
```php
'allowed_origins' => [
    'http://localhost:3000',
],
```

Для production:
```php
'allowed_origins' => [
    'https://nexora-room15.store',
    'https://www.nexora-room15.store',
],
```

#### `allowed_headers`
Дозволені заголовки. `['*']` дозволяє всі заголовки, включаючи:
- `X-XSRF-TOKEN` (для CSRF protection)
- `X-Cart-Token` (для кошика)
- `X-Guest-Id` (для favorites)
- `X-Comparison-Token` (для comparison)
- `Accept-Language` (для локалізації)
- `Accept-Currency` (для валюти)
- `Content-Type`, `Accept` (стандартні заголовки)

#### `supports_credentials`
**КРИТИЧНО**: Має бути `true` для cookie-based authentication. Це дозволяє браузеру відправляти cookies з cross-origin запитами.

**УВАГА**: Якщо `supports_credentials: true`, то `allowed_origins` НЕ може містити wildcard `*`. Потрібно явно вказати всі дозволені домени.

## 3. Налаштування `config/sanctum.php`

Переконайтеся, що Sanctum правильно налаштований:

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort()
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the bearer
    | token that's present on an incoming request for authentication.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. If this value is null, personal access tokens do
    | not expire. This won't affect the lifetime of first-party sessions.
    |
    */

    'expiration' => null,

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum you may need to
    | customize some of the middleware Sanctum uses while processing the
    | request. You may change the middleware listed below as required.
    |
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
        'validate_csrf_token' => Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    ],
];
```

## 4. Налаштування `config/session.php`

Переконайтеся, що session конфігурація правильна:

```php
<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Session Driver
    |--------------------------------------------------------------------------
    |
    | This option controls the default session "driver" that will be used on
    | requests. By default, we will use the lightweight native driver but
    | you may specify any of the other wonderful drivers provided here.
    |
    */

    'driver' => env('SESSION_DRIVER', 'cookie'),

    /*
    |--------------------------------------------------------------------------
    | Session Lifetime
    |--------------------------------------------------------------------------
    |
    | Here you may specify the number of minutes that you wish the session
    | to be allowed to remain idle before it expires. If you want them
    | to immediately expire on the browser closing, set that option.
    |
    */

    'lifetime' => env('SESSION_LIFETIME', 120),

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Name
    |--------------------------------------------------------------------------
    |
    | Here you may change the name of the cookie used to identify a session
    | instance by ID. The name specified here will get used every time a
    | new session cookie is created by the framework for every driver.
    |
    */

    'cookie' => env('SESSION_COOKIE', 'laravel_session'),

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Path
    |--------------------------------------------------------------------------
    |
    | The session cookie path determines the path for which the cookie will
    | be regarded as available. Typically, this will be the root path of
    | your application but you are free to change this when necessary.
    |
    */

    'path' => env('SESSION_PATH', '/'),

    /*
    |--------------------------------------------------------------------------
    | Session Cookie Domain
    |--------------------------------------------------------------------------
    |
    | Here you may change the domain of the cookie used to identify a session
    | in your application. This will determine which domains the cookie is
    | available to in your application. A sensible default has been set.
    |
    */

    'domain' => env('SESSION_DOMAIN', null),

    /*
    |--------------------------------------------------------------------------
    | HTTPS Only Cookies
    |--------------------------------------------------------------------------
    |
    | By setting this option to true, session cookies will only be sent back
    | to the server if the browser has a HTTPS connection. This will keep
    | the cookie from being sent to you if it can not be done securely.
    |
    */

    'secure' => env('SESSION_SECURE_COOKIE', true),

    /*
    |--------------------------------------------------------------------------
    | HTTP Access Only
    |--------------------------------------------------------------------------
    |
    | Setting this value to true will prevent JavaScript from being able to
    | access the session cookie. This is important for security.
    |
    */

    'http_only' => true,

    /*
    |--------------------------------------------------------------------------
    | Same-Site Cookies
    |--------------------------------------------------------------------------
    |
    | This option determines how your cookies behave when cross-site requests
    | take place, and can be used to mitigate CSRF attacks. By default, we
    | will set this value to "lax" since this is a secure default value.
    |
    | Supported: "strict", "lax", "none", null
    |
    */

    'same_site' => env('SESSION_SAME_SITE', 'lax'),
];
```

## 5. Перевірка налаштувань

### Чеклист для перевірки

- [ ] `SESSION_DOMAIN` в `.env` встановлено правильно (з крапкою для піддоменів)
- [ ] `SANCTUM_STATEFUL_DOMAINS` містить всі домени фронтенду
- [ ] `config/cors.php` має `supports_credentials: true`
- [ ] `config/cors.php` має явно вказані `allowed_origins` (не wildcard)
- [ ] `config/cors.php` включає всі необхідні paths
- [ ] `SESSION_SAME_SITE` встановлено в `lax` або `none` (для cross-domain)
- [ ] `SESSION_SECURE_COOKIE` встановлено правильно (true для HTTPS, false для HTTP в development)

### Тестування

1. **Перевірка CSRF cookie**:
   ```bash
   curl -v -X GET https://api.nexora-room15.store/sanctum/csrf-cookie \
     -H "Origin: http://localhost:3000" \
     -H "Cookie: laravel_session=..." \
     --cookie-jar cookies.txt
   ```

2. **Перевірка CORS headers**:
   ```bash
   curl -v -X OPTIONS https://api.nexora-room15.store/api/v1/cart \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-XSRF-TOKEN,Content-Type"
   ```

   Очікувані headers у відповіді:
   - `Access-Control-Allow-Origin: http://localhost:3000`
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: *`

## 6. Типові проблеми та рішення

### Проблема: Cookies не відправляються

**Причини**:
- `supports_credentials: false` в CORS
- `SESSION_DOMAIN` не відповідає домену фронтенду
- `SANCTUM_STATEFUL_DOMAINS` не містить домен фронтенду
- `SESSION_SAME_SITE` встановлено в `strict` для cross-domain

**Рішення**:
- Встановити `supports_credentials: true` в `config/cors.php`
- Перевірити `SESSION_DOMAIN` та `SANCTUM_STATEFUL_DOMAINS`
- Встановити `SESSION_SAME_SITE: lax` або `none`

### Проблема: 419 CSRF Token Mismatch

**Причини**:
- CSRF cookie не отримано перед POST/PUT запитом
- XSRF-TOKEN cookie не відправляється з запитом
- X-XSRF-TOKEN header не встановлено правильно

**Рішення**:
- Переконатися, що `/sanctum/csrf-cookie` викликається перед модифікуючими запитами
- Перевірити, що XSRF-TOKEN cookie встановлюється та відправляється
- Перевірити, що X-XSRF-TOKEN header додається до запитів

### Проблема: CORS error в браузері

**Причини**:
- `allowed_origins` не містить origin фронтенду
- `supports_credentials: true` разом з wildcard `*` в `allowed_origins`
- Відсутній OPTIONS handler для preflight запитів

**Рішення**:
- Додати origin фронтенду до `allowed_origins`
- Видалити wildcard `*` з `allowed_origins` якщо `supports_credentials: true`
- Переконатися, що Laravel обробляє OPTIONS запити

## 7. Production налаштування

Для production середовища:

```env
SESSION_DOMAIN=.nexora-room15.store
SANCTUM_STATEFUL_DOMAINS=nexora-room15.store,www.nexora-room15.store
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
FRONTEND_URL=https://nexora-room15.store
```

```php
// config/cors.php
'allowed_origins' => [
    'https://nexora-room15.store',
    'https://www.nexora-room15.store',
],
```

## 8. Development налаштування

Для development середовища:

```env
SESSION_DOMAIN=localhost
SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
FRONTEND_URL=http://localhost:3000
```

```php
// config/cors.php
'allowed_origins' => [
    'http://localhost:3000',
],
```

## Додаткові ресурси

- [Laravel Sanctum Documentation](https://laravel.com/docs/11.x/sanctum)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [SameSite Cookie Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

