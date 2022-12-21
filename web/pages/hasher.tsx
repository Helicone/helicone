import { useState } from "react";
import { hashAuth } from "../lib/supabaseClient";

const Hasher = () => {
  const [hash, setHash] = useState<string | null>(null);

  return (
    <div className="mx-10">
      <h1>Hasher</h1>
      <input
        type="text"
        placeholder="Enter a string to hash"
        onChange={(e) => {
          hashAuth(e.target.value).then((hash) => setHash(hash));
        }}
        className="bg-slate-800 py-2 px-4 rounded-md"
      />
      <p>{hash}</p>
    </div>
  );
};

export default Hasher;
