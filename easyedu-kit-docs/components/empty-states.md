# Empty States

Empty states explain that a list is empty or that filters hide all results.

## Mixins

```scss
.my-empty {
  @include easyedu.empty-state;
}

.my-inline-empty {
  @include easyedu.inline-empty-state;
}

.my-search-empty {
  @include easyedu.search-empty-state;
}
```

Use different wording for true empty data and filter/search results. For
example: "No groups exist yet" is not the same as "No groups match these
filters".
