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
		Array.isArray(locationSelection) && locationSelection.length > 0 ?
			locationSelection
		: (
			Array.isArray(randomLocationSelection) &&
			randomLocationSelection.length > 0
		) ?
			randomLocationSelection
		:	[];

	if (!mapBounds) {
		return (
			// flex-1 so this fills the Panel body (which is now a flex column)
			<div className='flex-1 min-h-0 relative overflow-hidden'>
				<img
					src={fallbackImage}
					alt='Auroa Placeholder'
					className='w-full h-full object-cover'
					style={{ filter: "brightness(0.6) saturate(0.5)" }}
				/>
				{/* Overlay */}
				<div
					className='absolute inset-0 pointer-events-none'
					style={{
						background:
							"radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
					}}
				/>
				{/* Standby label */}
				<div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
					<span className='font-mono text-[9px] tracking-[0.3em] text-lines/20 uppercase'>
						Tactical Feed Offline
					</span>
				</div>
			</div>
		);
	}

	return (
		// flex-1 fills the Panel body; NoneGeographicalMap uses 100% width/height internally
		<div className='flex-1 min-h-0 relative overflow-hidden'>
			<NoneGeographicalMap
				key={`${generationMode}-${JSON.stringify(mapBounds)}-${imgURL}-${locationsToDisplay.length}`}
				bounds={mapBounds}
				locationsInProvince={locationsToDisplay}
				imgURL={imgURL}
				infilPoint={infilPoint}
				exfilPoint={exfilPoint}
				fallbackExfil={fallbackExfil}
			/>
		</div>
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
