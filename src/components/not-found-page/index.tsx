/**
 * Renders the 404 Not Found page.
 * Styled to match the main app's DaisyUI theme.
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-w-screen min-h-screen bg-base-200 flex items-center p-5 lg:p-20 overflow-hidden relative">
      <div className="flex-1 min-h-full min-w-full rounded-3xl bg-base-100 shadow-xl p-10 lg:p-20 relative md:flex items-center text-center md:text-left">
        <div className="w-full">
          <div className="mb-10 md:mb-20 mt-10 md:mt-20 text-gray-600 font-light">
            <h1 className="font-black uppercase text-3xl lg:text-5xl text-primary mb-4">
              404
            </h1>
            <p className="text-lg pb-2 text-base-content font-semibold">
              Page Not Found
            </p>
            <p className="text-base-content opacity-70 mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
            <a
              href="/"
              className="btn btn-primary btn-sm md:btn-md"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
      <div className="w-64 md:w-96 h-96 md:h-full bg-accent bg-opacity-10 absolute -top-64 md:-top-96 right-20 md:right-32 rounded-full pointer-events-none -rotate-45 transform"></div>
      <div className="w-96 h-full bg-secondary bg-opacity-10 absolute -bottom-96 right-64 rounded-full pointer-events-none -rotate-45 transform"></div>
    </div>
  );
};

export default NotFoundPage;
