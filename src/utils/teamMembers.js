// teamMembers.js — shared helpers for reading the activeSlots/reserves team
// shape. Centralizes what used to be duplicated `rolesObj(team.operatorRoles)`
// logic across Teams.jsx/TeamView.jsx/Roster.jsx now that class travels with
// the membership record instead of living in a side-map.

// Extract a string operator id from either a populated operator object or a
// bare id string (activeSlots/reserves entries hold `operatorId`, which may
// or may not be populated depending on the query).
export const memberOperatorId = (member) => {
	if (!member) return null;
	const id = member.operatorId;
	if (id && typeof id === "object") return id._id ?? null;
	return id ?? null;
};

// The populated Operator object for a member, if the query populated it.
export const memberOperator = (member) => {
	if (!member || !member.operatorId || typeof member.operatorId !== "object") return null;
	return member.operatorId;
};

export const activeMembers = (team) => (team?.activeSlots ?? []).filter(Boolean);
export const reserveMembers = (team) => team?.reserves ?? [];
export const casualtyMembers = (team) => team?.casualties ?? [];
export const activeCount = (team) => activeMembers(team).length;
export const reserveCount = (team) => reserveMembers(team).length;
export const casualtyCount = (team) => casualtyMembers(team).length;
export const totalCount = (team) => activeCount(team) + reserveCount(team);

// 1-4 if the operator is in an active slot on this team, else null.
export const slotNumberFor = (team, operatorId) => {
	const idx = (team?.activeSlots ?? []).findIndex((m) => m && memberOperatorId(m) === operatorId);
	return idx >= 0 ? idx + 1 : null;
};

export const isOnTeam = (team, operatorId) =>
	activeMembers(team).some((m) => memberOperatorId(m) === operatorId) ||
	reserveMembers(team).some((m) => memberOperatorId(m) === operatorId);

// Which team (if any) currently has this operator, and where.
export const findOperatorTeam = (teams, operatorId) => {
	for (const team of teams) {
		const slot = slotNumberFor(team, operatorId);
		if (slot) return { team, slot, reserve: false };
		if (reserveMembers(team).some((m) => memberOperatorId(m) === operatorId)) {
			return { team, slot: null, reserve: true };
		}
	}
	return null;
};

// The membership record (operatorId + class) for an operator on a team, if any.
export const memberFor = (team, operatorId) =>
	activeMembers(team).find((m) => memberOperatorId(m) === operatorId) ??
	reserveMembers(team).find((m) => memberOperatorId(m) === operatorId) ??
	null;
