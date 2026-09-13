export default function PublicFooter() {
  return (
    <footer className="landing-footer">
      <p className="landing-footer-text">
        &copy; {new Date().getFullYear()} CivicResolve. A public service
        platform.
      </p>
    </footer>
  );
}
