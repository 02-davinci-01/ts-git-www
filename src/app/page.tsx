import { Terminal } from "../components/Terminal";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#f7f7f7] sm:px-6 sm:py-8 md:px-10 md:py-12 box-border">
      <div className="w-full max-w-3xl h-dvh sm:h-[min(80vh,700px)]">
        <Terminal />
      </div>
      <footer className="hidden sm:block mt-5 text-[10px] text-neutral-300 select-none tracking-wide">
        rendered to reality by the divine hermit
      </footer>
    </div>
  );
}
