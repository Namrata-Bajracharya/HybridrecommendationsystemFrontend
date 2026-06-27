import { useEffect, useState } from "react";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import customFetch from "../axios/custom";
import { checkUserProfileFormData } from "../utils/checkUserProfileFormData";
import { setLoginStatus } from "../features/auth/authSlice";
import { store } from "../store";
import Cookies from "js-cookie";
import { routesName } from "../RoutesName/Routes";

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>();

  const logout = () => {
    toast.error("Logged out successfully");
    localStorage.removeItem("user");
    Cookies.remove("token");
    store.dispatch(setLoginStatus(false));
    navigate("/login");
  };

  const fetchUser = async () => {
    const response = await customFetch.get(routesName.AuthRoute().me);
    setUser(response.data);
  };

  const updateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Get form data
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    // Check if form data is valid
    if (!checkUserProfileFormData(data)) return;
    try {
      await customFetch.put(routesName.UserRoute().updateProfile, {
        email: data.email,
        first_name: data.name,
        last_name: data.lastname,
        phone: data.phone || "",
      });
      toast.success("User updated successfully");
      fetchUser();
    } catch (e) {
      toast.error("User update failed");
      return;
    }

    const userId = JSON.parse(localStorage.getItem("user") || "{}").id;
    if (!userId) {
      toast.error("Please login to view this page");
      navigate("/login");
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Please login to view this page");
      navigate("/login");
    } else {
      fetchUser();
    }
  }, [navigate]);
  return (
    <div className="max-w-screen-lg mx-auto mt-24 px-5">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      <form className="flex flex-col gap-6" onSubmit={updateUser}>
        <div className="flex flex-col gap-1">
          <label htmlFor="firstname">First Name</label>
          <input
            type="text"
            className="bg-white border border-black text-xl py-2 px-3 w-full outline-none max-[450px]:text-base"
            placeholder="Enter first name"
            id="firstname"
            name="name"
            defaultValue={user?.first_name}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lastname">Last Name</label>
          <input
            type="text"
            className="bg-white border border-black text-xl py-2 px-3 w-full outline-none max-[450px]:text-base"
            placeholder="Enter last name"
            id="lastname"
            name="lastname"
            defaultValue={user?.last_name}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            className="bg-white border border-black text-xl py-2 px-3 w-full outline-none max-[450px]:text-base"
            placeholder="Enter email address"
            id="email"
            name="email"
            defaultValue={user?.email}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            className="bg-white border border-black text-xl py-2 px-3 w-full outline-none max-[450px]:text-base"
            placeholder="Enter password"
            id="password"
            name="password"
            defaultValue={user?.password}
          />
        </div>
        <Button type="submit" text="Update Profile" mode="brown" />
        <Link
          to="/order-history"
          className="bg-white text-black text-center text-xl border border-gray-400 font-normal tracking-[0.6px] leading-[72px] w-full h-12 flex items-center justify-center max-md:text-base"
        >
          Order History
        </Link>
        <Button onClick={logout} text="Logout" mode="white" />
      </form>
    </div>
  );
};

export default UserProfile;
