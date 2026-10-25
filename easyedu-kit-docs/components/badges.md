# Badges And Tokens

Badges and tokens communicate metadata such as roles, groups, categories,
statuses and item counts.

## Mixins

```scss
.my-token {
  @include easyedu.token-pill(#eef8f2, #c7e3d1, #29724d);
}

.my-count {
  @include easyedu.count-badge-filled(var(--easyedu-group));
}

.my-more-token {
  @include easyedu.token-overflow-toggle(#eef8f2, #c7e3d1, #29724d);
}

.my-primary-identity {
  @include easyedu.identity-badge(#f3f8ff, #c7dcf2, #315d8f);
}
```

Use neutral count badges for `0`, and filled semantic badges when the count is
greater than zero.

## Identity Badges

Use `identity-badge` for one high-priority label that lives on the title line of
a card, for example a custom participant field selected by an administrator.
It is intentionally more compact than a regular token and should truncate with
ellipsis instead of pushing card actions onto a new line.

```html
<header class="my-card__header">
  <span class="my-card__title">Student name</span>
  <span class="my-primary-identity">Campus A</span>
</header>
```

Do not use identity badges for counters. Use `count-badge` variants for numeric
counts and `token-pill` variants for metadata rows.
