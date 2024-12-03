import DashboardBig from "@/public/static/home/dashboardbig";

const BigDashboard = () => {
  return (
    <div className="w-full mx-auto h-full relative">
      <DashboardBig />
      <div className="h-[100px] bg-[#f2f9fc] hidden md:block absolute bottom-0 w-full"></div>
    </div>
  );
};

export default BigDashboard;
