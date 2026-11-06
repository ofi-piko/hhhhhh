# Структура проекта

Мобильное приложение магазина: React Native + Expo + TypeScript.
Этот файл создан `main.py` и содержит актуальные пути внутри `src/`.

## Корень проекта

```text
README.md
main.py
src/
```

## Структура `src`

```text
src/
├── assets/
│   ├── icons/
│   └── images/
├── component/
│   ├── script/
│   └── style/
├── components/
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── delivery/
│   │   └── AddressFields.tsx
│   ├── order/
│   │   ├── OrderCard.tsx
│   │   └── OrderStatusBadge.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   └── ProductPrice.tsx
│   ├── staff/
│   │   └── OrderAssignmentCard.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Checkbox.tsx
│       ├── Loading.tsx
│       └── TextField.tsx
├── config/
│   └── env.ts
├── constants/
│   ├── app.ts
│   ├── orderStatuses.ts
│   └── roles.ts
├── features/
│   ├── admin/
│   │   └── screens/
│   │       └── AdminDashboardScreen.tsx
│   ├── auth/
│   │   └── screens/
│   │       ├── LoginScreen.tsx
│   │       └── RegisterScreen.tsx
│   ├── cart/
│   │   └── screens/
│   │       └── CartScreen.tsx
│   ├── catalog/
│   │   └── screens/
│   │       ├── CatalogScreen.tsx
│   │       ├── HomeScreen.tsx
│   │       └── ProductDetailsScreen.tsx
│   ├── checkout/
│   │   └── screens/
│   │       └── CheckoutScreen.tsx
│   ├── orders/
│   │   └── screens/
│   │       ├── OrderDetailsScreen.tsx
│   │       └── OrdersScreen.tsx
│   ├── owner/
│   │   └── screens/
│   │       └── OwnerDashboardScreen.tsx
│   ├── profile/
│   │   └── screens/
│   │       └── ProfileScreen.tsx
│   └── staff/
│       └── screens/
│           └── StaffOrdersScreen.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useOrders.ts
│   └── useProducts.ts
├── locales/
│   └── ru.ts
├── script/
├── services/
│   ├── api/
│   │   └── client.ts
│   ├── auth/
│   │   └── authService.ts
│   ├── cache/
│   │   ├── productCache.ts
│   │   └── storage.ts
│   ├── orders/
│   │   └── orderService.ts
│   ├── payments/
│   │   └── paymentService.ts
│   └── products/
│       └── productService.ts
├── store/
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── orderStore.ts
├── style/
├── theme/
│   ├── colors.ts
│   ├── spacing.ts
│   └── typography.ts
├── types/
│   ├── auth.ts
│   ├── delivery.ts
│   ├── order.ts
│   ├── payment.ts
│   ├── product.ts
│   └── roles.ts
└── utils/
    ├── formatCurrency.ts
    └── validation.ts
```

## Назначение папок

- `components/` — переиспользуемые компоненты интерфейса.
- `features/` — экраны по функциям и ролям приложения.
- `services/` — API, авторизация, товары, заказы, платежи и кеш.
- `hooks/` — пользовательские React-хуки.
- `store/` — общее состояние приложения.
- `types/` — типы TypeScript.
- `constants/` — роли, статусы и константы.
- `theme/` — цвета, отступы и типографика.
- `utils/` — вспомогательные функции.
- `config/` — конфигурация приложения.
- `locales/` — тексты интерфейса.
- `assets/` — изображения и иконки.

Файлы внутри `src/` намеренно создаются пустыми. Скрипт не заменяет существующие файлы и не удаляет папки. Штатные файлы Expo в корне проекта остаются без изменений.
