import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import useSheetStore from "@/zustand/useSheetStore";
import { Button } from "@/components/ui/button";
import PropTypes from "prop-types";

const SheetSide = ({ openSheet, side, content, title, description }) => {
	const { closeSheet } = useSheetStore();

	return (
		<Sheet
			open={openSheet === side}
			onOpenChange={closeSheet}>
			<>
				<SheetContent
					className='bg-linear-45 from-blk via-background to-neutral-800 text-fontz flex flex-col items-center overflow-y-auto  w-full p-4  max-h-[100vh]'
					side={side}
					aria-describedby='sheet-description'>
					<SheetHeader>
						<SheetTitle className='text-xl font-bold'>{title || ""}</SheetTitle>
					</SheetHeader>

					<SheetDescription>{description || ""}</SheetDescription>

					<div className='py-4'>
						{typeof content === "function" ? content() : content}
					</div>

					<SheetFooter>
						<SheetClose asChild>
							<Button
								className={"btn"}
								type='button'
								onClick={closeSheet}>
								Close
							</Button>
						</SheetClose>
					</SheetFooter>
				</SheetContent>
			</>
		</Sheet>
	);
};

SheetSide.propTypes = {
	openSheet: PropTypes.string,
	setOpenSheet: PropTypes.func.isRequired,
	side: PropTypes.oneOf(["left", "right", "top", "bottom"]).isRequired,
	content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
	title: PropTypes.string,
	description: PropTypes.string,
};

export default SheetSide;
