# R9 ? formatted empty cells, already implemented by S6

Base 4110785e already includes the full R9 reader requirements in 8b3810f9
(original S6 dbaeb9c4): setReadEmptyCells(false), data-only explicit Xlsx/Xls readers,
no arbitrary auto-detection, metadata preflight, read filter, bounded bytes/rows/
columns/cells and filepicker maxbytes. No additional production change is needed.

This branch supplies a dedicated R9 regression: genuine XLSX files with column-wide
styles, a huge reported worksheet dimension, a styled empty A4000 cell, styled
A1048576 and XFD3 cells. Every ZIP amendment is asserted to have actually occurred.
Column styles/dimension and bounded blank cells preserve exactly one data row;
out-of-bound actual cell positions fail before materializing huge worksheets.
All private input temporaries are removed on success/failure.

PASS: 21 dedicated assertions under PHP memory_limit=128M; observed peak 27262976
bytes. S6 real XLSX/CSV suite 37 assertions PASS, including 3000-row parsing,
file/structure bounds, format rejection and exception cleanup. Fixture PHP lint PASS.
No AMD/SCSS/template/runtime/build or database changes. Legacy XLS is unavailable
in the supplied native library: controlled conversion error, no real-XLS PASS.
Confirmation remains capped at 1000 by B2. Neither native imports nor Apache were run.
