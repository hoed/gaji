
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-medium">Halaman Tidak Ditemukan</h2>
      <p className="mt-2 text-muted-foreground">
        Maaf, halaman yang Anda cari tidak tersedia.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}
