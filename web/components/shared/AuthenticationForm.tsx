import { useState } from "react";

interface AuthenticationFormProps {
  formType: "login" | "register" | "reset" | "resetPassword";
  onSubmit: (state: AuthFormState) => void;
  error: string | null;
  onPasswordReset?: () => void;
  resetEmail?: string;
}

export interface AuthFormState {
  email: string;
  password: string;
}

const AuthenticationForm = (props: AuthenticationFormProps) => {
  const {
    formType: formType,
    onSubmit,
    onPasswordReset,
    error,
    resetEmail,
  } = props;

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");

  const isFormValid = () => {
    if (formType === "login") {
      return email.length > 0 && password.length > 0;
    } else if (formType === "register") {
      return (
        email.length > 0 &&
        password.length > 0 &&
        password === passwordConfirmation &&
        password.length > 0
      );
    } else if (formType === "reset") {
      return email.length > 0;
    } else if (formType === "resetPassword") {
      return password.length > 0 && password === passwordConfirmation;
    } else {
      throw new Error("Invalid form type");
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-black text-white">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <p className="text-4xl md:text-6xl font-bold text-center">Valyr</p>
          <h2 className="mt-6 text-center text-xl md:text-3xl font-thin tracking-tight text-white">
            {formType === "login"
              ? "Sign in to your account"
              : "Register a new account"}
          </h2>
          <p className="mt-2 text-center text-lg font-light text-gray-600">
            Or{" "}
            <a
              href={formType === "login" ? "/register" : "/login"}
              className="font-medium text-rose-600 hover:text-rose-500"
            >
              {formType === "login"
                ? "register a new account"
                : "sign in to your account"}
            </a>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md p-4">
          <div className="bg-zinc-700 py-8 px-4 shadow rounded-lg sm:px-10">
            <div className="space-y-6">
              {formType === "resetPassword" && (
                <div>
                  <div>Change password for</div>
                  <div>{resetEmail}</div>
                </div>
              )}
              {(formType === "reset" ||
                formType === "login" ||
                formType === "register") && (
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-zinc-300"
                  >
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full appearance-none rounded-md border text-black border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}

              {(formType === "resetPassword" ||
                formType === "login" ||
                formType === "register") && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-zinc-300"
                  >
                    Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full appearance-none rounded-md text-black border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
              {(formType === "resetPassword" || formType === "register") && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-zinc-300"
                  >
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="confirm-current-password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      className="block w-full appearance-none rounded-md text-black border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}
              <div>
                <button
                  disabled={!isFormValid()}
                  onClick={() =>
                    onSubmit({
                      email,
                      password,
                    })
                  }
                  type="submit"
                  className={`${
                    isFormValid()
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-gray-600 hover:bg-gray-700 hover:cursor-not-allowed"
                  } flex w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2`}
                >
                  {(() => {
                    if (formType === "login") {
                      return "Sign in";
                    }
                    if (formType === "register") {
                      return "Register";
                    }
                    if (formType === "resetPassword") {
                      return "Reset Password";
                    }
                    if (formType === "reset") {
                      return "Send Reset Email";
                    }
                    return "Submit";
                  })()}
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-4 text-sm text-red-600">
                <p>{error}</p>
              </div>
            )}
            {onPasswordReset && (
              <div>
                <div
                  className="font-light text-rose-600 hover:text-rose-500 hover:cursor-pointer mt-1"
                  onClick={() => onPasswordReset()}
                >
                  Forgot your password?
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthenticationForm;
