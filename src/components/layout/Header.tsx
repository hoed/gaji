/* src/components/layout/Header.tsx */
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client"; // Adjust path
import { toast } from "@/components/ui/sonner";

export default function Header() {
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
      // Redirect handled by App.tsx
    } catch (error) {
      console.error("Logout error:", error.message);
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <header className="border-b bg-background sticky top-0 z-30 h-16 flex items-center px-4 sm:px-6">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2 md:w-64">
          <div className="relative hidden md:flex w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari..."
              className="pl-8 bg-background w-full"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid gap-1 p-2">
                <DropdownMenuItem className="cursor-pointer">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Pembayaran PPh 21 Jatuh Tempo</p>
                    <p className="text-xs text-muted-foreground">Hari ini, 10 April 2025</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <div className="grid gap-1">
                    <p className="text-sm font-medium">Pembayaran BPJS Jatuh Tempo</p>
                    <p className="text-xs text-muted-foreground">Besok, 11 April 2025</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative gap-2">
                <span className="inline-block h-8 w-8 rounded-full bg-primary/20 text-primary grid place-items-center font-medium">HR</span>
                <span className="hidden md:inline-block">Admin HR</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Pengaturan</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}