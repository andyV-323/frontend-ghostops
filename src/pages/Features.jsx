import { useState } from "react";
import { Button, Card, CardHeader, Typography } from "@material-tailwind/react";
import { features } from "../config/features";
import PropTypes from "prop-types";

const FeatureCard = ({ title, icon, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="text-white bg-neutral-900 p-4 md:p-6  flex flex-col items-center shadow-black shadow-2xl rounded-2xl w-full max-w-xs md:max-w-sm lg:max-w-md">
      <CardHeader className="flex flex-col items-center font-semibold text-lg md:text-xl text-white bg-transparent p-4 md:p-5">
        <img src={icon} alt={`${title} icon`} className="w-10 h-10 mb-2" />
        <h3>{title}</h3>
      </CardHeader>
      <Typography className="text-center text-sm md:text-base">
        {description.slice(0, isExpanded ? description.length : 2).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </Typography>
      <Button
        onClick={handleToggle}
        className="bg-btn hover:bg-highlight hover:text-white text-black font-semibold py-2 px-6 md:py-3 md:px-8 rounded-lg shadow-lg transition duration-300 ease-in-out mt-4 md:mt-6"
      >
        {isExpanded ? "Show Less" : "Read More"}
      </Button>
    </Card>
  );
};

const Features = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-cover bg-center bg-neutral-800">
    

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 md:px-10 lg:px-20 mt-20 mb-10 place-items-center">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </div>
  );
};

FeatureCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  description: PropTypes.array.isRequired,
};

export default Features;
