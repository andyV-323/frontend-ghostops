import { NoneGeographicalMap } from "@/components";
import PropTypes from "prop-types";

const MapWrapper = ({
	mapBounds,
	locationSelection = [],
	randomLocationSelection = [],
	imgURL,
	fallbackImage = "/maps/Auroa.png",
	generationMode,
	infilPoint,
	exfilPoint,
	fallbackExfil,
}) => {
	const locationsToDisplay =
		Array.isArray(locationSelection) && locationSelection.length > 0
			? locationSelection
			: Array.isArray(randomLocationSelection) &&
			  randomLocationSelection.length > 0
			? randomLocationSelection
			: [];
	return mapBounds ? (
		<NoneGeographicalMap
			key={`${generationMode}-${mapBounds}-${imgURL}-${locationsToDisplay.length}`}
			bounds={mapBounds}
			locationsInProvince={locationsToDisplay}
			imgURL={imgURL}
			infilPoint={infilPoint}
			exfilPoint={exfilPoint}
			fallbackExfil={fallbackExfil}
		/>
	) : (
		<img
			src={fallbackImage}
			alt='Auroa Placeholder'
			className='w-full h-full object-cover'
		/>
	);
};

MapWrapper.propTypes = {
	mapBounds: PropTypes.arrayOf(PropTypes.array),
	locationSelection: PropTypes.array,
	randomLocationSelection: PropTypes.array,
	imgURL: PropTypes.string.isRequired,
	fallbackImage: PropTypes.string,
	generationMode: PropTypes.string.isRequired,
	infilPoint: PropTypes.array,
	exfilPoint: PropTypes.array,
	fallbackExfil: PropTypes.array,
};

export default MapWrapper;
