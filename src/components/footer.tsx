export function Footer(): JSX.Element {
  return (
    <footer className="w-full border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} PhysiVerse
        </p>
        <p className="opacity-80">Built with Next.js & ShadCN</p>
      </div>
    </footer>
  );
}


