# K21 native candidate

`test-k21-visual-controls-native.cjs` preserves the real browser scenarios for
More, guided-step labels (SM and Mass Import), and the slide-5 participant
specimen. It is a manual/CI candidate, not registered in the main smoke gate.
Use Node 22.11.0, an owned pool lease, its copy at 8052/8054/8055, course 71
with the existing long-member fixture, and an administrator secret file.
Never pass a password in the command line. The test never prints the secret.

Arguments, in order: `before|after fr|en width more|steps|mi-steps|specimen`
followed by absolute Playwright-module path, secret-file path, output directory,
and the leased base URL. `CHROME_EXECUTABLE` may select the local headless
browser. Run before on the baseline, deploy only to the owned copy, then run
after with the same output directory. Keep failed predecessors separately.

Before/after JSON and PNG are external artifacts. The More after gate checks
historical blue and unchanged geometry; it clicks to reveal actual member
rows. Guide checks use the real mobile drawer, never a forced hidden opener.
Specimen after checks 32px margins and no horizontal overflow. The stronger
cross-run comparisons and full six-case audit are recorded in the lot report.
No data-changing business action is invoked. Always restore the owned copy
from its exact backup and release the lease when done.
