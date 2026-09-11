
const CTA = () => {
  return (
    <section className="py-24 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sunrise-start/30 via-transparent to-sunrise-end/20"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-6xl font-bold text-primary-foreground">
              Ready for Better
              <br />
              <span className="bg-gradient-to-r from-sunrise-mid to-sunrise-end bg-clip-text text-transparent">
                Mornings?
              </span>
            </h2>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Waki is in development. This is a concept preview; a public app download is not available yet.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-primary-foreground/20">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-primary-foreground/70 text-sm">
              <div className="text-center md:text-left">
                <p>&copy; {new Date().getFullYear()} Waki Alarm. All rights reserved.</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
