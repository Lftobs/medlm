import { motion } from "framer-motion";

export default function Testimonials() {
  return (
    <section className="py-32 bg-slate-50 text-slate-900">
      <div className="container mx-auto px-6 max-w-[1400px]">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12"
        >
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-1.5 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-5 h-5 bg-blue-500 rounded-full" />
              ))}
            </div>
            <p className="text-2xl font-medium leading-relaxed mb-10 text-slate-800">
              "I had 15 years of records in a shoebox. MedLM digitized and
              organized them in 10 minutes. It found a trend in my iron levels
              that explained my fatigue."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center font-bold">
                SJ
              </div>
              <div>
                <div className="font-bold text-lg">Sarah Jenkins</div>
                <div className="text-sm text-slate-500 font-medium">
                  Patient
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-1.5 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-5 h-5 bg-slate-900 rounded-full" />
              ))}
            </div>
            <p className="text-2xl font-medium leading-relaxed mb-10 text-slate-800">
              "Finally, a tool that speaks FHIR but acts like consumer tech. The
              timeline view is what every EMR should look like."
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">
                DC
              </div>
              <div>
                <div className="font-bold text-lg">Dr. David Chen</div>
                <div className="text-sm text-slate-500 font-medium">
                  Internal Medicine
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
