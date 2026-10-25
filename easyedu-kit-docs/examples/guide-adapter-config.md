# Guide adapter configuration examples

These examples show the boundary between the shared guide controller and a
Moodle product adapter. They are illustrative and do not define final
EasyStud or Course Banner Builder content.

## Moodle initialization

Server code passes a root selector and JSON-serializable configuration to the
consumer's AMD namespace:

```php
$PAGE->requires->js_call_amd('local_example/easyedu_guide', 'init', [
    '[data-easyedu-guide-root]',
    [
        'storageKey' => 'local_example.guide.seen',
        'firstVisit' => true,
        'targets' => [
            'createItem' => '[data-example-create-item]',
            'itemList' => '[data-example-item-list]',
        ],
        'paths' => [
            'create-first-item' => [
                [
                    'id' => 'create',
                    'title' => get_string('guide_step_create', 'local_example'),
                    'target' => 'createItem',
                    'completionMode' => 'event',
                    'completeOn' => 'example:item-created',
                ],
            ],
        ],
    ],
]);
```

The component name, strings, selectors and event are product-owned. The
controller behavior is not.

## Target revealed by another control

Use `open` when the useful target is not rendered until a product control is
activated:

```js
{
  id: 'configure-preview',
  title: 'Configure the preview',
  target: 'savePreview',
  highlightTarget: 'previewFields',
  open: [
    {target: 'appearanceSection', delay: 320},
    {target: 'previewDisclosure', delay: 260}
  ],
  completionMode: 'action'
}
```

The open controls and completion condition belong to the adapter. Target
visibility, scrolling and highlight cleanup belong to the shared controller.

## Completion after business success

Dispatch completion only after the product action succeeds:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'create-first-item',
    step: 'create'
  }
}));
```

Opening a modal or clicking the checklist row must not complete an `action`,
`event` or `reload` step.

## Partial-page replacement

Destroy the old root before a product replaces its markup:

```js
const replaceGuide = (oldRoot, newRoot, config) => {
  Guide.destroy(oldRoot);
  oldRoot.replaceWith(newRoot);
  Guide.init(newRoot, config);
};
```

This preserves visitor progress while preventing duplicate document listeners,
orphan highlights and retained page-scroll locks.

## Direct AMD wrapper

For consumers that retain their existing direct AMD source wrapper, expose both
lifecycle methods:

```js
define([], function() {
  // Canonical source with `export` keywords removed.

  return {
    destroy: destroy,
    init: init
  };
});
```

The consumer batch must compare the wrapped body with the canonical source
before building. A successful minification does not prove behavioral parity.

## Product boundary examples

EasyStud may map targets such as participant filters, group creation and
grouping actions, and may open the guide from its product-owned compact
navigation. Those navigation routes and completion events stay in
`local_groupimport`.

Course Banner Builder may map source controls, layer editors, preview modals and
banner actions. Its slide restrictions remain explanatory adapter rules unless
the server capability layer separately enforces them.

Neither product should add a second focus trap, target resolver, highlight
positioner, return panel or scrolling animation around the shared guide.
