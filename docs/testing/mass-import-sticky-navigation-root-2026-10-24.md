# Floating Guide navigation root

Mass Import passes the navigation element itself to the shared Guide launcher.
Student Management passes its workspace ancestor. Descendant-only querySelector
missed the first case after the Mass Import floating opt-in was built correctly.
The same binding now accepts a matching root before looking for a descendant.

No Guide state, Motion, click handler, navigation lifetime or CSS is changed.
Verify source and built modules with matching root, ancestor, and absent navigation.
Native checks cover Student Management and Mass Import at 1600/768/390, rest,
scroll, hover, Guide open/close, return to top, with no course-data writes.
Check group/grouping quick-create native placeholders from the integrated base.

Build the cm/sm shared launcher as well as mi; build-mi-amd alone cannot update
amd/build/local/cm/guide_launcher.min.js. The --amd builder sequence in the durable
publish script includes both. Test the committed generated files before deploy.
