// Bounded read-only audit for the external Guide-only client.
// Use recorded IDs, not a global scan; API text is not painted-raster proof.
const ids = [
    '74a0e4b4-0497-8084-8008-bf99cdb52918',
    '6208b726-6df8-80e1-8008-bf93bb7f20d5',
    '6b665942-910b-80ef-8008-be63bff90dc2',
    '74a0e4b4-0497-8084-8008-bf9a1b450db4',
    '74a0e4b4-0497-8084-8008-bf9a68482f2c',
    '74a0e4b4-0497-8084-8008-bf9af3e84510',
];
return ids.map(id => {
    const shape = penpot.currentPage.getShapeById(id);
    if (!shape) throw new Error('Handoff composition missing: ' + id);
    return {id, name: shape.name, width: shape.width, height: shape.height,
        hidden: shape.hidden, topLevelChildren: shape.children.length};
});
