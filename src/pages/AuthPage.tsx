import { Link } from "react-router-dom";

export function AuthPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold underline">
        Auth
      </h1>
      <Link to="/home">Home</Link>
    </div>
  );
}
