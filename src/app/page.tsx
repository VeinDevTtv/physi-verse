import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to PhysiVerse</h1>
      </main>
      <Footer />
    </div>
  );
}
