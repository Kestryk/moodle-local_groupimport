# Course blocks on the EasyStud workspaces

Student Management and Mass Import call the public block-manager method
`show_only_fake_blocks(true)` after choosing the incourse layout, before header
rendering. Real course blocks remain configured and available on native course
pages, but are not loaded into these two workspaces. The course index, navigation,
breadcrumbs, permissions and block configuration are unchanged. Moodle-generated
fake blocks retain their normal behavior, including editing controls when editing
is enabled; this is not a global block-disable setting or a core patch.

Native acceptance uses a real nonempty HTML block in the test course, with the
block drawer preference open. Before the change both workspaces must render it;
afterwards neither may render it or its real-block drawer in normal viewing mode.
A native course page must still render the same block before and after. Check
FR/EN at 1600/1280/1024/768/390, with the course index and navigation preserved.
Restore the owned fixture and test-user drawer preferences afterwards.

The method is part of Moodle's public block manager and does not require a 5.x
API. No schema change, cache of participants or new style is introduced.
