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
              <a
                href="#highlights"
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 px-6 py-3 text-base font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                See Highlights
              </a>
            </div>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-slate-100 shadow-inner md:h-80 md:w-80">
            <Image
              src="/tours/ab.jpg"
              alt="Preview of the virtual tour lobby scene"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section
        id="highlights"
        className="mt-16 grid w-full max-w-5xl gap-6 md:grid-cols-3"
      >
        {[
          {
            title: "Immersive 360° scenes",
            description:
              "High-resolution panoramas that let you explore each room from every angle.",
          },
          {
            title: "Easy navigation",
            description:
              "Move between scenes with intuitive controls designed for desktop and mobile.",
          },
          {
            title: "Campus showcase",
            description:
              "Highlight academic spaces, hostels, activity zones, and more in one experience.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-slate-100 bg-white/70 p-6 shadow transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              {item.title}
            </h2>
            <p className="mt-3 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
