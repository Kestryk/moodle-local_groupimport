# Recette native V2 — 17 octobre 2026

Bilan : 78 points PASS, 7 points FAIL, correspondant à trois anomalies (aperçu 3 000 lignes, case de fiche compacte, Échap après dernier retrait). Zéro erreur de page/console dans les exécutions finales.

- A : S2/S4/S5/S7-M5 PASS ; S6 CSV et maxbytes PASS, aperçu XLSX 3 000 FAIL.
- B : R6/R8 PASS ; R9 lecture formatée PASS, aperçu bloqué par la borne de S6.
- C : K16-01/K16-14/K16-14b et aide tactile PASS ; K16-15 présent mais case compacte FAIL ; réserve clavier après dernier retrait en desktop.
- D : PHPUnit non exécuté, prérequis natifs manquants détaillés plus bas.

Source figée `108f0b2c52a47114b8b23afe28f201712050fc6a`, branche de recette `work/codex2/recette-v2-lots-20261017`. Runtime exclusif `http://localhost:8051`, base `moodle51perf`. Aucun correctif produit ni build. Les 296 fichiers synchronisés ont été vérifiés par hash et les caches purgés. Plugin mis à jour de 2026101501 à 2026101700 par le script de mise à jour natif du composant ; les 13 historiques existants ont été conservés. Le CLI Moodle standard est absent de cette copie.

Guide précédent terminé et poussé : `8316451e`, branche propre et synchronisée ; son rapport reste séparé.

## Résultats observés

| Lot / point | Langue / largeur | Résultat | Mesure ou motif |
|---|---|---|---|
| S2 — real Privacy export isolates the subject | EN / API  | PASS | {"export":[{"imports":[{"historyid":32,"timecreated":1792208009,"importedbyself":false,"rolledbackbyself":true,"changes":{"desiredstate":[{"userid":36562,"identifier":"old-subject@example.invalid"}],"reportrows":[{"userid":36562,"identifier":"old-subject@example.invalid","status":"success"}]},"timerolledback":0}]}]} |
| S2 — Privacy deletion preserves peer history | EN / API  | PASS | {"changes":{"desiredstate":[{"userid":36563,"identifier":"peer@example.invalid"}],"reportrows":[{"userid":36563,"identifier":"peer@example.invalid","status":"success"}]},"rollbackuserid":null} |
| S2 — manual scheduled task deletes expired only | EN / API  | PASS | {"retentionDays":30,"expiredDeleted":true,"recentKept":true} |
| S5 — native lookup enrolled only | EN / API  | PASS | {"enrolledFound":[36562],"outsideFound":[]} |
| S2 — all pre-existing history restored | EN / API  | PASS | {"beforeCount":13,"afterCount":13} |
| S6 — multiline-utf8.csv | EN / API  | PASS | {"rows":[["codex2-k16-01-a6143e6e07e5-0@example.invalid","Équipe été\nDeuxième ligne","Promotion"]]} |
| S6 — multiline-cp1252.csv | EN / API  | PASS | {"rows":[["codex2-k16-01-a6143e6e07e5-0@example.invalid","Équipe été\nDeuxième ligne","Promotion"]]} |
| R9/S6 — native reader 3000 formatted rows | EN / API  | PASS | {"rows":3000,"durationMs":738,"peakMemoryBytes":48234496} |
| S4 — GET rejected | EN / API  | PASS | {"http":200,"json":{"error":"Data submitted is invalid","errorcode":"invaliddata","stacktrace":"* line 37 of \\moodle\\local\\groupimport\\classes\\local\\ajax_security.php: core\\exception\\moodle_exception thrown\n* line 38 of \\moodle\\local\\groupimport\\ajax.php: call to local_groupimport\\local\\ajax_security::require_request()\n","debuginfo":"\r\nError code: invaliddata","reproductionlink":"http://localhost:8051/"}} |
| S4 — site course out of scope rejected | EN / API  | PASS | {"http":200,"json":{"success":false,"error":"Data submitted is invalid"}} |
| S4 — missing sesskey rejected | EN / API  | PASS | {"http":200,"json":{"error":"A required parameter (sesskey) was missing","errorcode":"missingparam","stacktrace":"* line 574 of \\moodle\\lib\\classes\\param.php: core\\exception\\moodle_exception thrown\n* line 452 of \\moodle\\lib\\classes\\param.php: call to core\\param->get_request_parameter()\n* line 659 of \\moodle\\lib\\moodlelib.php: call to core\\param->required_param()\n* line 73 of \\moodle\\lib\\sessionlib.php: call to required_param()\n* line 84 of \\moodle\\lib\\sessionlib.php: call to confirm_sesskey()\n* line 39 of \\moodle\\local\\groupimport\\ajax.php: call to require_sesskey()\n","debuginfo":"\r\nError code: missingparam","reproductionlink":"http://localhost:8051/"}} |
| R6 — 501 native addusers rejected | EN / API  | PASS | {"http":200,"json":{"success":false,"error":"This request exceeds the limit of 500 items. No changes were made. Select fewer items and try again."},"text":"{\"success\":false,\"error\":\"This request exceeds the limit of 500 items. No changes were made. Select fewer items and try again.\"}"} |
| S7-M5 — download and inspect native report XLSX | EN / API  | PASS | {"http":200,"contentType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","inspection":[{"lot":"S7-M5","point":"downloaded XLSX has no formula cells","status":"PASS","measure":{"formulas":[],"values":["Learner identifier","Group name","Grouping name (optional)","Import status","Details","'=1+1","'=1+1","'=1+1","Applied","'=1+1","'+SUM(1,1)","'+SUM(1,1)","'+SUM(1,1)","Applied","'+SUM(1,1)","'-1+1","'-1+1","'-1+1","Applied","'-1+1","'@SUM(1,1)","'@SUM(1,1)","'@SUM(1,1)","Applied","'@SUM(1,1)"]}}]} |
| R8 — history list excludes large changes payload | EN / API  | PASS | {"http":200,"bytes":326986,"hasHistory":true,"hasHeavyPayload":false} |
| S6 — multiline-utf8.csv native editable preview and cancel | EN / API  | PASS | {"upload":{},"previewRows":1,"firstGroup":"Équipe étéDeuxième ligne","cancelled":true} |
| S6 — multiline-cp1252.csv native editable preview and cancel | EN / API  | PASS | {"upload":{},"previewRows":1,"firstGroup":"Équipe étéDeuxième ligne","cancelled":true} |
| S6/R9 — formatted-3000.xlsx native editable preview and cancel | EN / API  | FAIL | expect(locator).toHaveCount(expected) failed  Locator:  locator('[data-local-groupimport-preview-row]') Expected: 3000 Received: 0 Timeout:  120000ms  Call log:   - Expect "toHaveCount" with timeout 120000ms   - waiting for locator('[data-local-groupimport-preview-row]')     238 × locator resolved to 0 elements         - unexpected value "0"  |
| K16-01 — PASS | fr 1600 | PASS | {"stage":"PASS","selectedMembers":60,"selectedGroups":16,"overflow":0} |
| K16-01 — PASS | en 1600 | PASS | {"stage":"PASS","selectedMembers":60,"selectedGroups":16,"overflow":0} |
| K16-01 — bounded member and grouping windows | fr 768 | PASS | {"members":60,"groups":16,"memberFocus":"36871","groupFocus":"8820"} |
| K16-01 — bounded member and grouping windows | fr 390 | PASS | {"members":60,"groups":16,"memberFocus":"36871","groupFocus":"8820"} |
| K16-01 — bounded member and grouping windows | en 768 | PASS | {"members":60,"groups":16,"memberFocus":"36871","groupFocus":"8820"} |
| K16-01 — bounded member and grouping windows | en 390 | PASS | {"members":60,"groups":16,"memberFocus":"36871","groupFocus":"8820"} |
| K16-01 — PASS | fr 768 | PASS | {"stage":"PASS","overflow":0} |
| K16-01 — PASS | fr 390 | PASS | {"stage":"PASS","overflow":0} |
| K16-01 — PASS | en 768 | PASS | {"stage":"PASS","overflow":0} |
| K16-01 — PASS | en 390 | PASS | {"stage":"PASS","overflow":0} |
| K16-14 — keep source copy and immediate destination count | fr 1600 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109060","groupid":"9549","userid":"37109"},{"id":"109061","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109060","groupid":"9549","userid":"37109"},{"id":"109062","groupid":"9550","userid":"37109"},{"id":"109061","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"1"} |
| K16-14b — minus removes copied member and immediately decrements | fr 1600 | PASS | {"response":{"success":true,"message":"Utilisateur retiré du groupe."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109060","groupid":"9549","userid":"37109"},{"id":"109061","groupid":"9552","userid":"37109"}]}} |
| K16-14 — unchecked moves and immediately updates both cards | fr 1600 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109060","groupid":"9549","userid":"37109"},{"id":"109061","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"removed":1,"unchanged":0,"message":"Appartenances d’origine déplacées : 1 ; ajouts à destination : 1 ; appartenances inchangées : 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109063","groupid":"9550","userid":"37109"},{"id":"109061","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"0"} |
| K16-15 — group details expose checkbox and minus | fr 1600 | PASS | {"eyeCandidates":1,"checkboxCount":3,"minusCount":2} |
| empty-touch — empty group help | fr 1600 | PASS | {"text":"Glissez des participants ici ou utilisez @","coarse":false} |
| K16-14 — keep source copy and immediate destination count | fr 768 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109064","groupid":"9549","userid":"37109"},{"id":"109065","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109064","groupid":"9549","userid":"37109"},{"id":"109066","groupid":"9550","userid":"37109"},{"id":"109065","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"1"} |
| K16-14b — minus removes copied member and immediately decrements | fr 768 | PASS | {"response":{"success":true,"message":"Utilisateur retiré du groupe."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109064","groupid":"9549","userid":"37109"},{"id":"109065","groupid":"9552","userid":"37109"}]}} |
| K16-14 — unchecked moves and immediately updates both cards | fr 768 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109064","groupid":"9549","userid":"37109"},{"id":"109065","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"removed":1,"unchanged":0,"message":"Appartenances d’origine déplacées : 1 ; ajouts à destination : 1 ; appartenances inchangées : 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109067","groupid":"9550","userid":"37109"},{"id":"109065","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"0"} |
| K16-15 — group details expose checkbox and minus | fr 768 | PASS | {"eyeCandidates":0,"checkboxCount":3,"minusCount":2} |
| empty-touch — empty group help | fr 768 | PASS | {"text":"Utilisez @ ou « Ajouter à un groupe »","coarse":false} |
| K16-14 — keep source copy and immediate destination count | fr 390 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109069","groupid":"9549","userid":"37109"},{"id":"109070","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109069","groupid":"9549","userid":"37109"},{"id":"109071","groupid":"9550","userid":"37109"},{"id":"109070","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"1"} |
| K16-14b — minus removes copied member and immediately decrements | fr 390 | PASS | {"response":{"success":true,"message":"Utilisateur retiré du groupe."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109069","groupid":"9549","userid":"37109"},{"id":"109070","groupid":"9552","userid":"37109"}]}} |
| K16-14 — unchecked moves and immediately updates both cards | fr 390 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109069","groupid":"9549","userid":"37109"},{"id":"109070","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"removed":1,"unchanged":0,"message":"Appartenances d’origine déplacées : 1 ; ajouts à destination : 1 ; appartenances inchangées : 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109072","groupid":"9550","userid":"37109"},{"id":"109070","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"0"} |
| K16-15 — group details expose checkbox and minus | fr 390 | PASS | {"eyeCandidates":0,"checkboxCount":3,"minusCount":2} |
| empty-touch — empty group help | fr 390 | PASS | {"text":"Utilisez @ ou « Ajouter à un groupe »","coarse":true} |
| K16-14 — keep source copy and immediate destination count | en 1600 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109074","groupid":"9549","userid":"37109"},{"id":"109075","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants added: 1; already in this group: 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109074","groupid":"9549","userid":"37109"},{"id":"109076","groupid":"9550","userid":"37109"},{"id":"109075","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"1"} |
| K16-14b — minus removes copied member and immediately decrements | en 1600 | PASS | {"response":{"success":true,"message":"User removed from the group."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109074","groupid":"9549","userid":"37109"},{"id":"109075","groupid":"9552","userid":"37109"}]}} |
| K16-14 — unchecked moves and immediately updates both cards | en 1600 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109074","groupid":"9549","userid":"37109"},{"id":"109075","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"removed":1,"unchanged":0,"message":"Source memberships moved: 1; added at destination: 1; unchanged: 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109077","groupid":"9550","userid":"37109"},{"id":"109075","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"0"} |
| K16-15 — group details expose checkbox and minus | en 1600 | PASS | {"eyeCandidates":1,"checkboxCount":3,"minusCount":2} |
| empty-touch — empty group help | en 1600 | PASS | {"text":"Drag participants here or use @","coarse":false} |
| K16-14 — keep source copy and immediate destination count | en 768 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109078","groupid":"9549","userid":"37109"},{"id":"109079","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants added: 1; already in this group: 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109078","groupid":"9549","userid":"37109"},{"id":"109080","groupid":"9550","userid":"37109"},{"id":"109079","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"1"} |
| K16-14b — minus removes copied member and immediately decrements | en 768 | PASS | {"response":{"success":true,"message":"User removed from the group."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109078","groupid":"9549","userid":"37109"},{"id":"109079","groupid":"9552","userid":"37109"}]}} |
| K16-14 — unchecked moves and immediately updates both cards | en 768 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109078","groupid":"9549","userid":"37109"},{"id":"109079","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"removed":1,"unchanged":0,"message":"Source memberships moved: 1; added at destination: 1; unchanged: 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109081","groupid":"9550","userid":"37109"},{"id":"109079","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"0"} |
| K16-15 — group details expose checkbox and minus | en 768 | PASS | {"eyeCandidates":0,"checkboxCount":3,"minusCount":2} |
| empty-touch — empty group help | en 768 | PASS | {"text":"Use @ or “Add to a group”","coarse":false} |
| K16-14 — keep source copy and immediate destination count | en 390 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109083","groupid":"9549","userid":"37109"},{"id":"109084","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants added: 1; already in this group: 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109083","groupid":"9549","userid":"37109"},{"id":"109085","groupid":"9550","userid":"37109"},{"id":"109084","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"1"} |
| K16-14b — minus removes copied member and immediately decrements | en 390 | PASS | {"response":{"success":true,"message":"User removed from the group."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109083","groupid":"9549","userid":"37109"},{"id":"109084","groupid":"9552","userid":"37109"}]}} |
| K16-14 — unchecked moves and immediately updates both cards | en 390 | PASS | {"stage":"choose-destination","before":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109083","groupid":"9549","userid":"37109"},{"id":"109084","groupid":"9552","userid":"37109"}]},"response":{"success":true,"added":1,"removed":1,"unchanged":0,"message":"Source memberships moved: 1; added at destination: 1; unchanged: 0."},"after":{"courseId":239,"userId":37109,"groupIds":[9549,9550,9551,9552],"rows":[{"id":"109086","groupid":"9550","userid":"37109"},{"id":"109084","groupid":"9552","userid":"37109"}]},"destinationCount":"2","sourceCount":"0"} |
| K16-15 — group details expose checkbox and minus | en 390 | PASS | {"eyeCandidates":0,"checkboxCount":3,"minusCount":2} |
| empty-touch — empty group help | en 390 | PASS | {"text":"Use @ or “Add to a group”","coarse":true} |
| K16-14b — native context menu adds and updates destination without reload | fr 1600 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109397","groupid":"9742","userid":"37175"},{"id":"109398","groupid":"9745","userid":"37175"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."},"count":"2","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109397","groupid":"9742","userid":"37175"},{"id":"109399","groupid":"9743","userid":"37175"},{"id":"109398","groupid":"9745","userid":"37175"}]}} |
| K16-14b — native held participant drag onto empty group updates immediately | fr 1600 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109397","groupid":"9742","userid":"37175"},{"id":"109399","groupid":"9743","userid":"37175"},{"id":"109398","groupid":"9745","userid":"37175"}]},"drag":{"from":{"x":115,"y":589.859375},"to":{"x":846.640625,"y":539.984375},"heldMs":750},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."},"count":"1","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109397","groupid":"9742","userid":"37175"},{"id":"109399","groupid":"9743","userid":"37175"},{"id":"109400","groupid":"9744","userid":"37175"},{"id":"109398","groupid":"9745","userid":"37175"}]}} |
| K16-14b — native context menu adds and updates destination without reload | fr 768 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109401","groupid":"9742","userid":"37175"},{"id":"109402","groupid":"9745","userid":"37175"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."},"count":"2","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109401","groupid":"9742","userid":"37175"},{"id":"109403","groupid":"9743","userid":"37175"},{"id":"109402","groupid":"9745","userid":"37175"}]}} |
| K16-14b — native context menu adds and updates destination without reload | fr 390 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109404","groupid":"9742","userid":"37175"},{"id":"109405","groupid":"9745","userid":"37175"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants ajoutés : 1 ; déjà présents dans ce groupe : 0."},"count":"2","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109404","groupid":"9742","userid":"37175"},{"id":"109406","groupid":"9743","userid":"37175"},{"id":"109405","groupid":"9745","userid":"37175"}]}} |
| K16-14b — native context menu adds and updates destination without reload | en 1600 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109407","groupid":"9742","userid":"37175"},{"id":"109408","groupid":"9745","userid":"37175"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants added: 1; already in this group: 0."},"count":"2","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109407","groupid":"9742","userid":"37175"},{"id":"109409","groupid":"9743","userid":"37175"},{"id":"109408","groupid":"9745","userid":"37175"}]}} |
| K16-14b — native held participant drag onto empty group updates immediately | en 1600 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109407","groupid":"9742","userid":"37175"},{"id":"109409","groupid":"9743","userid":"37175"},{"id":"109408","groupid":"9745","userid":"37175"}]},"drag":{"from":{"x":115,"y":589.859375},"to":{"x":846.640625,"y":539.984375},"heldMs":750},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants added: 1; already in this group: 0."},"count":"1","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109407","groupid":"9742","userid":"37175"},{"id":"109409","groupid":"9743","userid":"37175"},{"id":"109410","groupid":"9744","userid":"37175"},{"id":"109408","groupid":"9745","userid":"37175"}]}} |
| K16-14b — native context menu adds and updates destination without reload | en 768 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109411","groupid":"9742","userid":"37175"},{"id":"109412","groupid":"9745","userid":"37175"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants added: 1; already in this group: 0."},"count":"2","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109411","groupid":"9742","userid":"37175"},{"id":"109413","groupid":"9743","userid":"37175"},{"id":"109412","groupid":"9745","userid":"37175"}]}} |
| K16-14b — native context menu adds and updates destination without reload | en 390 | PASS | {"before":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109414","groupid":"9742","userid":"37175"},{"id":"109415","groupid":"9745","userid":"37175"}]},"response":{"success":true,"added":1,"existing":0,"skipped":0,"message":"Participants added: 1; already in this group: 0."},"count":"2","after":{"courseId":243,"userId":37175,"groupIds":[9742,9743,9744,9745],"rows":[{"id":"109414","groupid":"9742","userid":"37175"},{"id":"109416","groupid":"9743","userid":"37175"},{"id":"109415","groupid":"9745","userid":"37175"}]}} |
| K16-14b — quick removal from isolated member selection updates count | fr 1600 | PASS | {"before":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109090","groupid":"9553","userid":"37111"},{"id":"109091","groupid":"9556","userid":"37111"}]},"response":{"success":true,"message":"Utilisateur retiré du groupe."},"count":"0","after":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109091","groupid":"9556","userid":"37111"}]}} |
| K16-14b — quick removal from isolated member selection updates count | fr 768 | PASS | {"before":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109092","groupid":"9553","userid":"37111"},{"id":"109093","groupid":"9556","userid":"37111"}]},"response":{"success":true,"message":"Utilisateur retiré du groupe."},"count":"0","after":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109093","groupid":"9556","userid":"37111"}]}} |
| K16-14b — quick removal from isolated member selection updates count | fr 390 | PASS | {"before":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109094","groupid":"9553","userid":"37111"},{"id":"109095","groupid":"9556","userid":"37111"}]},"response":{"success":true,"message":"Utilisateur retiré du groupe."},"count":"0","after":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109095","groupid":"9556","userid":"37111"}]}} |
| K16-14b — quick removal from isolated member selection updates count | en 1600 | PASS | {"before":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109096","groupid":"9553","userid":"37111"},{"id":"109097","groupid":"9556","userid":"37111"}]},"response":{"success":true,"message":"User removed from the group."},"count":"0","after":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109097","groupid":"9556","userid":"37111"}]}} |
| K16-14b — quick removal from isolated member selection updates count | en 768 | PASS | {"before":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109098","groupid":"9553","userid":"37111"},{"id":"109099","groupid":"9556","userid":"37111"}]},"response":{"success":true,"message":"User removed from the group."},"count":"0","after":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109099","groupid":"9556","userid":"37111"}]}} |
| K16-14b — quick removal from isolated member selection updates count | en 390 | PASS | {"before":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109100","groupid":"9553","userid":"37111"},{"id":"109101","groupid":"9556","userid":"37111"}]},"response":{"success":true,"message":"User removed from the group."},"count":"0","after":{"courseId":240,"userId":37111,"groupIds":[9553,9554,9555,9556],"rows":[{"id":"109101","groupid":"9556","userid":"37111"}]}} |
| K16-15 — dialog checkbox toggles and minus removes membership | fr 1600 | FAIL | expect(locator).toBeHidden() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]') Expected: hidden Received: visible Timeout:  5000ms  Call log:   - Expect "toBeHidden" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]')     13 × locator resolved to <div role="dialog" aria-modal="true" id="yui_3_18_1_1_1792210611280_52" data-easystud-editor-context="g |
| K16-15 — dialog checkbox toggles and minus removes membership | fr 768 | FAIL | expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to  |
| K16-15 — dialog checkbox toggles and minus removes membership | fr 390 | FAIL | expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to  |
| K16-15 — dialog checkbox toggles and minus removes membership | en 1600 | FAIL | expect(locator).toBeHidden() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]') Expected: hidden Received: visible Timeout:  5000ms  Call log:   - Expect "toBeHidden" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]')     13 × locator resolved to <div role="dialog" aria-modal="true" id="yui_3_18_1_1_1792210661058_52" data-easystud-editor-context="g |
| K16-15 — dialog checkbox toggles and minus removes membership | en 768 | FAIL | expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to  |
| K16-15 — dialog checkbox toggles and minus removes membership | en 390 | FAIL | expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to  |
| S5 — native import applies enrolled user only | EN / API  | PASS | {"upload":{"url":"http://localhost:8051/draftfile.php/37939/user/draft/898577394/scope.csv","id":898577394,"file":"scope.csv"},"preview":["2Ready","3Participant not found or unavailable in this course: codex2-k16-01-70da2d6c094a-59."],"database":{"groups":[{"name":"QA Teacher Applied","members":[37113]}],"outsideEnrolled":false}} |
| S6 — non-admin upload honours course maxbytes | EN / API  | PASS | {"bytes":3000,"maxbytes":1024,"upload":{"error":"The file scope.csv is too large. The maximum size you can upload is 1 KB.","errorcode":"maxbytesfile","stacktrace":"* line 203 of \\moodle\\repository\\upload\\lib.php: file_exception thrown\n* line 64 of \\moodle\\repository\\upload\\lib.php: call to repository_upload->process_upload()\n* line 328 of \\moodle\\repository\\repository_ajax.php: call to repository_upload->upload()\n","debuginfo":"\r\nError code: maxbytesfile","reproductionlink":"http://localhost:8051/local/groupimport/index.php?id=241&lang=en"}} |
| R6 — addusers refuses 501 before mutations | EN / API  | PASS | {"http":200,"json":{"success":false,"error":"This request exceeds the limit of 500 items. No changes were made. Select fewer items and try again."}} |
| R6 — addemails refuses 501 before mutations | EN / API  | PASS | {"http":200,"json":{"success":false,"error":"This request exceeds the limit of 500 items. No changes were made. Select fewer items and try again."}} |
| R6 — removemembers refuses 501 before mutations | EN / API  | PASS | {"http":200,"json":{"success":false,"error":"This request exceeds the limit of 500 items. No changes were made. Select fewer items and try again."}} |
| R6 — deletegroups refuses 501 before mutations | EN / API  | PASS | {"http":200,"json":{"success":false,"error":"This request exceeds the limit of 500 items. No changes were made. Select fewer items and try again."}} |
| R6 — 500 repeated existing members accepted without duplicates | EN / API  | PASS | {"http":200,"json":{"success":true,"added":0,"existing":1,"skipped":0,"message":"Participants added: 0; already in this group: 1."}} |
| S4 — foreign course cannot rename own fixture group | EN / API  | PASS | {"http":200,"json":{"success":false,"error":"Data submitted is invalid"}} |

Les mesures détaillées, réponses natives et preuves d’appartenance avant/après sont dans [le JSON](recette-v2-lots-17-10-2026.json). Une réponse du superviseur à code 0 ne vaut pas PASS : chaque assertion est reportée séparément.

Les lignes menu/glisser de la première matrice des appartenances sont remplacées par la recette ciblée `menu-drag` (clic droit sur bureau, bouton ⋮ compact, glisser natif tenu). Le retrait rapide est remplacé par `quick-remove` (sélection de membre isolée). Le JSON conserve les lignes antérieures, y compris leurs échecs de précondition ; elles ne sont ni effacées ni comptées comme défauts produit. Pour K16-01 compact, la preuve des fenêtres de membres/groupes précède le point d’arrêt `ungrouped-pages` ; la pagination est une preuve séparée du catalogue courant.

## Anomalies et réserves

- **S6/R9 / formatted-3000.xlsx native editable preview and cancel**, en 1600 : expect(locator).toHaveCount(expected) failed  Locator:  locator('[data-local-groupimport-preview-row]') Expected: 3000 Received: 0 Timeout:  120000ms  Call log:   - Expect "toHaveCount" with timeout 120000ms   - waiting for locator('[data-local-groupimport-preview-row]')     238 × locator resolved to 0 elements         - unexpected value "0"  — [capture](<C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/security-settled/easystud/authenticated/easystud-authenticated-20261017T033257846Z-37448/playwright-output/v2-security-settled-native-18f83-d-navigation-native-own8051/fail-10.png>).
- **K16-15 / dialog checkbox toggles and minus removes membership**, fr 1600 : expect(locator).toBeHidden() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]') Expected: hidden Received: visible Timeout:  5000ms  Call log:   - Expect "toBeHidden" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]')     13 × locator resolved to <div role="dialog" aria-modal="true" id="yui_3_18_1_1_1792210611280_52" data-easystud-editor-context="group" data-easystud-advanced-settings-modal="1" aria-labelledby="local-groupimport-easystud-editor-title-group" class="local-groupimport-easystud-modal local-groupimport-easystud-settings-modal easyedu-modal-layer">…</div>        - unexpected value "visible"  — [capture](<C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/entity-member/easystud/authenticated/easystud-authenticated-20261017T041612561Z-16972/playwright-output/v2-entity-member-native-V2-61506-og-checkbox-and-minus-FR-EN/failure-fr-1600.png>).
- **K16-15 / dialog checkbox toggles and minus removes membership**, fr 768 : expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to <input type="checkbox" id="yui_3_18_1_1_1792210630498_39" data-easystud-entity-select="37177"/>        - unexpected value "unchecked"  — [capture](<C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/entity-member/easystud/authenticated/easystud-authenticated-20261017T041612561Z-16972/playwright-output/v2-entity-member-native-V2-61506-og-checkbox-and-minus-FR-EN/failure-fr-768.png>).
- **K16-15 / dialog checkbox toggles and minus removes membership**, fr 390 : expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to <input type="checkbox" id="yui_3_18_1_1_1792210646368_39" data-easystud-entity-select="37177"/>        - unexpected value "unchecked"  — [capture](<C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/entity-member/easystud/authenticated/easystud-authenticated-20261017T041612561Z-16972/playwright-output/v2-entity-member-native-V2-61506-og-checkbox-and-minus-FR-EN/failure-fr-390.png>).
- **K16-15 / dialog checkbox toggles and minus removes membership**, en 1600 : expect(locator).toBeHidden() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]') Expected: hidden Received: visible Timeout:  5000ms  Call log:   - Expect "toBeHidden" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]')     13 × locator resolved to <div role="dialog" aria-modal="true" id="yui_3_18_1_1_1792210661058_52" data-easystud-editor-context="group" data-easystud-advanced-settings-modal="1" aria-labelledby="local-groupimport-easystud-editor-title-group" class="local-groupimport-easystud-modal local-groupimport-easystud-settings-modal easyedu-modal-layer">…</div>        - unexpected value "visible"  — [capture](<C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/entity-member/easystud/authenticated/easystud-authenticated-20261017T041612561Z-16972/playwright-output/v2-entity-member-native-V2-61506-og-checkbox-and-minus-FR-EN/failure-en-1600.png>).
- **K16-15 / dialog checkbox toggles and minus removes membership**, en 768 : expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to <input type="checkbox" id="yui_3_18_1_1_1792210680415_39" data-easystud-entity-select="37177"/>        - unexpected value "unchecked"  — [capture](<C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/entity-member/easystud/authenticated/easystud-authenticated-20261017T041612561Z-16972/playwright-output/v2-entity-member-native-V2-61506-og-checkbox-and-minus-FR-EN/failure-en-768.png>).
- **K16-15 / dialog checkbox toggles and minus removes membership**, en 390 : expect(locator).toBeChecked() failed  Locator:  locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]') Expected: checked Received: unchecked Timeout:  5000ms  Call log:   - Expect "toBeChecked" with timeout 5000ms   - waiting for locator('#local-groupimport-easystud').locator('[data-easystud-advanced-settings-modal]').locator('[data-easystud-entity-select="37177"]')     14 × locator resolved to <input type="checkbox" id="yui_3_18_1_1_1792210700022_39" data-easystud-entity-select="37177"/>        - unexpected value "unchecked"  — [capture](<C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/entity-member/easystud/authenticated/easystud-authenticated-20261017T041612561Z-16972/playwright-output/v2-entity-member-native-V2-61506-og-checkbox-and-minus-FR-EN/failure-en-390.png>).

S6/R9 : le lecteur XLSX natif accepte 3 000 lignes formatées, mais `index.php:1097` applique `import_execution::MAX_ROWS` (1 000) avant l’aperçu, au lieu de la borne d’aperçu (5 000). Aucun correctif appliqué.

Les premiers essais de recherche de membres et d’édition de CSV utilisaient respectivement une attente obsolète (champ au lieu de loupe) et une navigation non attendue. Les essais originaux sont conservés dans les artefacts externes, puis remplacés par des specs successor avec le même oracle. Ils ne constituent pas des défauts produit. La limite du picker testée avec admin reste une observation spécifique à ce rôle ; la recette enseignant décide le résultat de cette limite.

Reproduction du défaut S6/R9 (EN, 1600) : sur le cours jetable, ouvrir Mass Import, téléverser `formatted-3000.xlsx` (3 000 lignes de données, colonne A entière en gras), cliquer Preview. Attendu : 3 000 lignes éditables. Observé : 0 ligne d’aperçu et message de dépassement de 1 000 lignes. Le lecteur natif traite le fichier en 738 ms avec pic PHP de 48 234 496 octets ; cette réussite de lecture ne valide pas l’aperçu navigateur. La capture de la ligne FAIL est conservée ci-dessus.

K16-15, FR/EN 768 et 390 : depuis Groupes, ouvrir le menu ⋮ du groupe source, puis ses paramètres/détails ; dans Membres, cliquer la case du participant. Attendu : case cochée ; observé : case toujours décochée après 5 s (4 cas), contrôle visible et clic sans force. La présence de la case et du « − » passe, leur fonctionnement ne doit pas en être déduit. La compatibilité de sélection dans `advanced_settings.js:419` est une piste statique : l’ouverture par menu sélectionne le groupe, puis la case demande une sélection de membre. Pas de correctif appliqué.

K16-15 / complément clavier, FR/EN 1600 : ouvrir directement la fiche du groupe source, cocher puis décocher le membre, cliquer son « − », attendre sa disparition, appuyer sur Échap. Case et suppression native passent (`checkboxToggled=true`, `response.success=true`, ligne retirée), mais la fenêtre reste visible après 5 s (2 cas). Les captures et oracles d’origine sont conservés ; cette fermeture n’est pas déclarée PASS. Le point mérite un contrôle de focus après suppression du bouton focalisé.

## PHPUnit natif (D)

Non exécuté : cette copie ne contient ni `vendor/autoload.php`, ni `vendor/bin/phpunit`, ni `composer.json`, ni `phpunit.xml.dist`, ni `lib/phpunit/cli/init.php`. Le bootstrap existe seul. Installer les dépendances ne suffit donc pas à initialiser cette copie. Aucun autre runtime touché, aucune base PHPUnit créée sans initialiseur ; `phpunit-preflight.json` décrit les chemins contrôlés. Les contrôles natifs du fournisseur Privacy et du lookup ne sont pas présentés comme des exécutions PHPUnit.

## Nettoyage

```json
{
    "fixtures": [
        {
            "courseId": 242,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 245,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 237,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 244,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 230,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 234,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 232,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 233,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 228,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 229,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 224,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 225,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 235,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 238,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 239,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 243,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 240,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 226,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 4
        },
        {
            "courseId": 227,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 4
        },
        {
            "courseId": 231,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 236,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 241,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        },
        {
            "courseId": 246,
            "courseDeleted": true,
            "activeFixtureUsers": [],
            "groupsRemaining": 0,
            "groupingsRemaining": 0,
            "historyRemaining": 0,
            "ownDraftsRemoved": 0
        }
    ],
    "pluginVersion": "2026101700",
    "historyCount": 13,
    "showcompleteview": "1",
    "retentionDays": "365"
}

```

Artefacts complets : `C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017`. Aucune action sur :80, :8052, :8054, :8055, Apache ou MariaDB.
