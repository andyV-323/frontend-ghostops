import { Footer } from "../components";

const Dashboard = () => {
  return (
    <div className="bg-neutral-800 p-2 min-h-screen"> {/* Ensures full screen height */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3  bg-background/50 min-h-screen">
        <div className="border border-lines p-4 h-62 md:h-75 lg:h-85 flex items-center justify-center">1</div>
        <div className="border border-lines p-4 h-62 md:h-75 lg:h-85 flex items-center justify-center">2</div>
        <div className="border border-lines p-4 h-62 md:h-75 lg:h-85 flex items-center justify-center">3</div>
        <div className="border border-lines p-4 h-62 md:h-75 lg:h-85 flex items-center justify-center">4</div>
        <div className="border border-lines p-4 h-62 md:h-75 lg:h-85 flex items-center justify-center">5</div>
        <div className="border border-lines p-4 h-62 md:h-75 lg:h-85 flex items-center justify-center">6</div>
      </div>
      <Footer/>
    </div>
    
  );
};

export default Dashboard;
