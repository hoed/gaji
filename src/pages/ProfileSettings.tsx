
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

const ProfileSettings = () => {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profil berhasil disimpan!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Profil</h1>
        <p className="text-muted-foreground">
          Kelola informasi akun dan preferensi pengguna
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2 space-y-1">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" defaultValue="Admin HR" />
              </div>
              <div className="w-full sm:w-1/2 space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="admin@example.com" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2 space-y-1">
                <Label htmlFor="role">Jabatan</Label>
                <Input id="role" defaultValue="HR Manager" disabled />
              </div>
              <div className="w-full sm:w-1/2 space-y-1">
                <Label htmlFor="department">Departemen</Label>
                <Input id="department" defaultValue="Human Resources" disabled />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full space-y-1">
                <Label htmlFor="profile-photo">Foto Profil</Label>
                <Input id="profile-photo" type="file" className="cursor-pointer" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">Simpan Perubahan</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default ProfileSettings;
