/**
 * Freeze explicitly selected group memberships before opening a destination.
 * Business identity is a Group/User pair, not the user's entire membership set.
 * Responsive copies can contain the same pair; never submit them twice.
 *
 * @param {HTMLElement} root Owned EasyStud workspace.
 * @param {HTMLElement[]} members Selected native member rows.
 * @returns {ReadonlyArray<Object>} Immutable source pairs and display names.
 */
export const snapshotMemberPairs = (root, members) => {
    const pairs = new Map();
    (members || []).forEach(member => {
        const group = member?.closest('[data-easystud-group-id]');
        const groupid = group?.getAttribute('data-easystud-group-id') || '';
        const userid = member?.getAttribute('data-easystud-member-id') || '';
        if (!root.contains(member) || !/^\d+$/.test(groupid) || !/^\d+$/.test(userid) ||
                /^0+$/.test(groupid) || /^0+$/.test(userid)) {
            throw new Error('Invalid selected membership.');
        }
        const name = member.querySelector('.local-groupimport-easystud-member__name');
        pairs.set(groupid + ':' + userid, Object.freeze({groupid, userid, fullname: name?.textContent.trim() || ''}));
    });
    return Object.freeze([...pairs.values()]);
};
