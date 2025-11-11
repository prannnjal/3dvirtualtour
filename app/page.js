import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-100 via-sky-100 to-white px-6 py-16 text-slate-900">
      <section className="w-full max-w-5xl rounded-3xl bg-white/80 p-10 shadow-xl backdrop-blur-lg">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-6 md:max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Saplings
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Discover our campus with an immersive 360° virtual tour.
            </h1>
            <p className="text-lg text-slate-600">
              Walk through the lobby, classrooms, hostels, and auditorium from
              wherever you are. Experience the spaces, understand our
              infrastructure, and plan your visit with confidence.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/virtual-tour"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                Enter the Virtual Tour
              </Link>
              
            </div>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-slate-100 shadow-inner md:h-80 md:w-80">
            <Image
              src="/tours/lobby.jpg"
              alt="Preview of the virtual tour lobby scene"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      
    </main>
  );
}
