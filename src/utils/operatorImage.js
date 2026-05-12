export const KIT_TYPES = {
	specialty: "Specialty",
	directAction: "Direct Action",
	recon: "Recon",
	covert: "Covert",
};

export const IMAGE_FIELDS = {
	specialty: "imageKeySpecialty",
	directAction: "imageKeyDirectAction",
	recon: "imageKeyRecon",
	covert: "imageKeyCovert",
};

export const IMAGE_TYPE_LIST = [
	{ key: "imageKeySpecialty", type: "specialty", label: "Specialty" },
	{ key: "imageKeyDirectAction", type: "directAction", label: "Direct Action" },
	{ key: "imageKeyRecon", type: "recon", label: "Recon" },
	{ key: "imageKeyCovert", type: "covert", label: "Covert" },
];

export function getOperatorDisplayImage(operator, kits = []) {
	const activeKit = operator.activeKitId
		? kits.find((k) => k._id === operator.activeKitId)
		: null;
	if (activeKit) {
		const field = IMAGE_FIELDS[activeKit.type || "specialty"];
		if (field && operator[field]) return operator[field];
	}
	return (
		operator.imageKeySpecialty ||
		operator.imageKey ||
		operator.image ||
		"/ghost/Default.png"
	);
}
