# Visual candidates held out of localhost preview

The WIP successor to `8d41b90` preserves the pre-existing Mass Import balance
candidate, human checklist and administration colour-picker scope repair.
It is not a preview request or a claim of visual acceptance. Generated CSS is
intentionally unchanged while Penpot/native composition checks remain open.

The colour-picker PHP wrapper now supplies the missing `easyedu-ui` ancestor
required by the public component selectors, including no-JavaScript rendering.
No private colour-picker CSS was added. Native appearance, admin typography
and Restore EasyEdu defaults still require the dedicated admin pass.

Only the preceding generated-AMD closure repair is eligible for the immediate
functional preview. Do not deploy this WIP just to make the source tree clean.
