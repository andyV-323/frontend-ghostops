import PropTypes from "prop-types";

export const OperatorPropTypes = PropTypes.shape({
	_id: PropTypes.string.isRequired,
	callSign: PropTypes.string.isRequired,
	class: PropTypes.arrayOf(PropTypes.string),
	bio: PropTypes.string,
	status: PropTypes.oneOf(["Active", "Injured", "KIA"]),
	image: PropTypes.string,
	imageKey: PropTypes.string,
	assignedKitIds: PropTypes.arrayOf(PropTypes.string),
});
