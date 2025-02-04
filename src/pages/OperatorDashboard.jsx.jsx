
import {OperatorForm} from "../components";



const OperatorDashboard = () => {
  return (
    <div className="bg-neutral-800 p-2 min-h-screen flex flex-col"> {/* Ensures full screen height */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 grid-rows-6 lg:grid-rows-2 flex-grow ">
        <div className="dash"><div className="bg-highlight border border-lines "><img src="/ghost/Nomad.png" className="h-30 w-30"/></div></div>
        <div className="dash">2</div>
        <div className="dash">3</div>
        <div className="dash">4</div>
        <div className="dash">5</div>
        <div className="dash">6</div>
      </div>
     <OperatorForm/>
    </div>
    
  );
};

export default OperatorDashboard;
