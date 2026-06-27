import { Link, useNavigate } from "react-router-dom";
import { Button, InputFeild } from "../components";
import { checkLoginFormData } from "../utils/checkLoginFormData";
import customFetch from "../axios/custom";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { setLoginStatus } from "../features/auth/authSlice";
import { store } from "../store";
import Cookies from "js-cookie";
import { routesName } from "../RoutesName/Routes";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Get form data
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    // Check if form data is valid
    if (!checkLoginFormData(data)) return;

    try {
      const loginResponse = await customFetch.post(
        routesName.AuthRoute().login,
        {
          email: data.email,
          password: data.password,
        }
      );

      const token = loginResponse.data?.token;
      if (!token) {
        toast.error("Login failed");
        return;
      }

      Cookies.set("token", token, { sameSite: "strict" });

      const profileResponse = await customFetch.get(routesName.AuthRoute().me);
      const user = profileResponse.data;

      localStorage.setItem("user", JSON.stringify(user));
      store.dispatch(setLoginStatus(true));

      toast.success("You logged in successfully");
      navigate(user.role === "admin" ? "/admin" : "/user-profile");
    } catch (error) {
      toast.error("Please enter correct email and password");
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      toast.success("You are already logged in");
      navigate(JSON.parse(user).role === "admin" ? "/admin" : "/user-profile");
    }
  }, [navigate]);

  return (
    <div className="max-w-screen-2xl mx-auto pt-24 flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="max-w-5xl mx-auto flex flex-col gap-5 max-sm:gap-3 items-center justify-center max-sm:px-5"
      >
        <h2 className="text-5xl text-center mb-5 font-thin max-md:text-4xl max-sm:text-3xl max-[450px]:text-xl max-[450px]:font-normal">
          Welcome Back! Login here:
        </h2>
        <div className="flex flex-col gap-2 w-full">
          <InputFeild label="Your email" name="email" type="email" placeholder="Enter email address" />
          <InputFeild label="Your password" name="password" type="password" placeholder="Enter password" />
        </div>
        <Button type="submit" text="Login" mode="brown" />
        <Link
          to="/register"
          className="text-xl max-md:text-lg max-[450px]:text-sm"
        >
          Don’t have an account?{" "}
          <span className="text-secondaryBrown">Register now</span>.
        </Link>
      </form>
    </div>
  );
};
export default Login;
