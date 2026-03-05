import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold underline">
        Home - dahsboard
      </h1>
      <Link to="/auth">Auth</Link>
    </div>
  );
}

