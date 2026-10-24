# Clean identity/navigation deployment build

Start from 57162d56, remove tracked CSS and AMD outputs in a dedicated checkout,
then rebuild with Node22.11.0/Sass1.79.1 and the release AMD builders. The shared
publisher omits easyedu_confirmation and guide_welcome: both were regenerated
from their source with the same named-AMD Terser settings, including maps and a
registration check. Require every removed output to exist before packaging.

No product source is changed by this build. Preserve 220ms navigation-only hover,
fa-users-gear for EasyStud, the existing platform cap, and the primary palette
already accepted on the Mass Import preview. Native production verification and
HTTP/archive hashes are retained in the external deployment report.
