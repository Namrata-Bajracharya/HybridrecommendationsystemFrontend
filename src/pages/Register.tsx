import { Link, useNavigate } from "react-router-dom";
import { Button, InputFeild } from "../components";
import { checkRegisterFormData } from "../utils/checkRegisterFormData";
import customFetch from "../axios/custom";
import toast from "react-hot-toast";
import { routesName } from "../RoutesName/Routes";

const Register = () => {
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Get form data
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    // Check if form data is valid
    if (!checkRegisterFormData(data)) return;

    // Check if user with this email already exists
    try {
      const response = await customFetch.post(routesName.AuthRoute().register, {
        email: data.email,
        password: data.password,
        first_name: data.name,
        last_name: data.lastname,
        phone: data.phone || "",
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("User registered successfully");
        navigate("/login");
      }
    } catch (error) {
      toast.error("User with this email already exists");
      return;
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto pt-24 flex items-center justify-center">
      <form
        onSubmit={handleRegister}
        className="max-w-5xl mx-auto flex flex-col gap-5 max-sm:gap-3 items-center justify-center max-sm:px-5"
      >
        <h2 className="text-5xl text-center mb-5 font-thin max-md:text-4xl max-sm:text-3xl max-[450px]:text-xl max-[450px]:font-normal">
          Welcome! Register here:
        </h2>
        <div className="flex flex-col gap-2 w-full">
          <InputFeild label="Your name" name="name" type="text" placeholder="Enter name" />
          <InputFeild label="Your lastname" name="lastname" type="text" placeholder="Enter lastname" />
          <InputFeild label="Your email" name="email" type="email" placeholder="Enter email address" />
          <InputFeild label="Your password" name="password" type="password" placeholder="Enter password" />
          <InputFeild label="Confirm password" name="confirmPassword" type="password" placeholder="Confirm password" />
        </div>
        <Button type="submit" text="Register" mode="brown" />
        <Link
          to="/login"
          className="text-xl max-md:text-lg max-[450px]:text-sm"
        >
          Already have an account?{" "}
          <span className="text-secondaryBrown">Login now</span>.
        </Link>
      </form>
    </div>
  );
};
export default Register;
