/** @format */
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPen } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

const IdCard = ({ operator }) => {
	const navigate = useNavigate();

	if (!operator) {
		return (
			<div className='text-center text-gray-400'>
				Select an operator to view details
			</div>
		);
	}

	return (
		<div className='relative w-[300px] sm:w-[325px] md:w-[325px] lg:w-[295px]  xl:w-[400px] h-[180px] mx-auto'>
			<div className='flex items-center rounded-lg  overflow-hidden relative'>
				<img
					className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-cover rounded-lg bg-highlight'
					src={operator.image}
					alt={operator?.name || "Ghost Operator"}
				/>
				<div className='flex flex-col justify-center p-3 w-full'>
					<h5 className='text-lg font-bold text-gray-400'>{operator.sf}</h5>
					<ul className='text-xs sm:text-sm text-gray-400 dark:text-gray-400'>
						<li>
							<strong>Name:</strong> {operator.name}
						</li>
						<li>
							<strong>Callsign:</strong> {operator.callSign}
						</li>
						<li>
							<strong>Nationality:</strong>
							{operator.nationality}
						</li>
						<li>
							<strong>Rank:</strong> {operator.rank}
						</li>
					</ul>
				</div>

				{/* Edit Button */}
				<FontAwesomeIcon
					className='absolute top-2 right-2 text-xl text-btn cursor-pointer hover:text-white'
					icon={faUserPen}
					onClick={() =>
						navigate("/dashboard/edit", {
							state: { operator }, // Pass operator data
						})
					}
				/>
			</div>
		</div>
	);
};

export default IdCard;
