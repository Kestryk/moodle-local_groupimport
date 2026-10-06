// Input body for the separately owned, external Guide-only MCP client.
// Read-only: the client guards both Guide file and page before executing it.
return {
    fileId: penpot.currentFile.id,
    fileName: penpot.currentFile.name,
    pageId: penpot.currentPage.id,
    pageName: penpot.currentPage.name,
};
