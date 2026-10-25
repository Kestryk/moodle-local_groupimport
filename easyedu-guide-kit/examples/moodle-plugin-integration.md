# Moodle plugin integration example

This example describes the recommended integration path for a Moodle plugin.

## 1. Copy the guide kit

```powershell
.\sync-easyedu-kit.ps1 -IncludeGuide -TargetPluginRoots @(
  "C:\dev\Moodle 51\MoodleWindowsInstaller-latest-501\server\moodle\local\coursebannerbuilder"
)
```

Then move or copy the reference files into Moodle-native locations:

- `easyedu-guide-kit/amd/src/easyedu_guide.js` to `amd/src/easyedu_guide.js`;
- `easyedu-guide-kit/templates/easyedu_guide.mustache` to `templates/easyedu_guide.mustache`;
- strings from `easyedu-guide-kit/lang/*/easyedu_guide.php` into the plugin language files.

## 2. Define plugin-specific slides

Build a `slides` array in PHP and render it through the template. Keep slide
content specific to the plugin, but reuse the shared visual structure.

```php
$templatecontext['slides'] = [
    [
        'index' => 0,
        'title' => get_string('guidecreatebanner', 'local_coursebannerbuilder'),
        'content' => format_text($content, FORMAT_HTML),
        'target' => 'createBanner',
        'guidedpath' => 'banner-basics',
        'hasguidedpath' => true,
    ],
];
```

## 3. Initialise the AMD module

```php
$PAGE->requires->js_call_amd('local_coursebannerbuilder/easyedu_guide', 'init', [
    '[data-easyedu-guide-root]',
    [
        'storageKey' => 'local_coursebannerbuilder.easyedu_guide.seen',
        'firstVisit' => true,
        'targets' => [
            'createBanner' => '[data-easyedu-guide-target="create-banner"]',
            'layerList' => '[data-easyedu-guide-target="layer-list"]',
            'saveButton' => '[data-easyedu-guide-target="save-button"]',
        ],
        'paths' => [
            'banner-basics' => [
                [
                    'id' => 'create-banner',
                    'title' => get_string('guidepathcreatebanner', 'local_coursebannerbuilder'),
                    'target' => 'createBanner',
                    'completeOn' => 'coursebannerbuilder:banner-created',
                ],
            ],
        ],
    ],
]);
```

## 4. Emit completion events after real actions

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
  detail: {
    path: 'banner-basics',
    step: 'create-banner'
  }
}));
```

Prefer completing steps after successful plugin actions, not only after users
click checklist items. This makes the guide feel connected to the real UI.

## 5. Refresh highlights after UI transitions

If the action changes the page layout, refresh the guide once the interface has
settled:

```js
document.dispatchEvent(new CustomEvent('easyedu:guide-refresh-highlight', {
  detail: {
    target: 'createBanner',
    dock: true
  }
}));
```

Use this after opening panels, changing pages, applying filters, inserting Ajax
content or any transition that can move the highlighted element.
